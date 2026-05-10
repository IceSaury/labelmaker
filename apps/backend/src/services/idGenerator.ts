import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type IdType = 'A' | 'C' | 'P';

export async function generateUniqueCode(type: IdType): Promise<string> {
  const year = new Date().getFullYear();

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.sequence.findUnique({
      where: { year_type: { year, type } },
    });

    if (existing) {
      return tx.sequence.update({
        where: { year_type: { year, type } },
        data: { current: { increment: 1 } },
      });
    }

    return tx.sequence.create({
      data: { id: `${year}-${type}`, year, type, current: 1 },
    });
  });

  const number = String(seq.current).padStart(4, '0');
  return `JOR-${year}-${type}${number}`;
}

export async function generatePartCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(await generateUniqueCode('P'));
  }
  return codes;
}
