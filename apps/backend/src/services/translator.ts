import { translate } from '@vitalets/google-translate-api';

export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const { text: result } = await translate(text, {
    from: sourceLang,
    to: targetLang,
  });
  return result;
}
