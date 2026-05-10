import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, role: 'admin' },
  });

  console.log(`Admin user created: ${username} / ${password}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
