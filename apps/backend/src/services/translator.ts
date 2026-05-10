interface TranslationProvider {
  name: string;
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

class DeepSeekProvider implements TranslationProvider {
  name = 'deepseek';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, nothing else. Do not add quotes, explanations, or commentary.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content.trim();
  }
}

class NoopProvider implements TranslationProvider {
  name = 'noop';

  async translate(text: string, _sourceLang: string, targetLang: string): Promise<string> {
    if (targetLang === 'en') {
      return `[Translation not configured: ${text}]`;
    }
    return `[未配置翻译: ${text}]`;
  }
}

export function getTranslator(): TranslationProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey && apiKey.length > 0) {
    return new DeepSeekProvider(apiKey);
  }
  return new NoopProvider();
}
