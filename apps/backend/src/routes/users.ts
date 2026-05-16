import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.delete('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

router.put('/:id/password', adminOnly, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.json({ success: true });
});

export default router;
