import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AuthRequest, authMiddleware, adminOnly, generateToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(['operator', 'admin']).default('operator'),
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user.id, user.role);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/register', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { username, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash, role },
  });

  res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

export default router;
