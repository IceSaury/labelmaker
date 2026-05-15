import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { translateText } from '../services/translator';

const router = Router();
router.use(authMiddleware);

const schema = z.object({
  text: z.string().min(1).max(500),
  sourceLang: z.enum(['zh', 'en', 'ar']).default('zh'),
  targetLang: z.enum(['zh', 'en', 'ar']).default('en'),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { text, sourceLang, targetLang } = parsed.data;

  try {
    const translated = await translateText(text, sourceLang, targetLang);
    res.json({ translated });
  } catch {
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
