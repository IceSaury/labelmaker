import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { generateUniqueCode, generatePartCodes } from '../services/idGenerator';

const router = Router();
const prisma = new PrismaClient();

const createItemSchema = z.object({
  type: z.enum(['simple', 'complex', 'container']),
  nameCn: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().optional(),
  weightGross: z.number().positive().optional(),
  weightNet: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  parts: z.array(z.object({
    nameCn: z.string().min(1),
    nameEn: z.string().min(1),
    nameAr: z.string().optional(),
    partDescription: z.string().optional(),
    weightGross: z.number().positive().optional(),
    weightNet: z.number().positive().optional(),
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  })).optional(),
});

const updateItemSchema = createItemSchema.partial();

// GET /api/items - list all items with search/filter
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { search, type, page = '1', limit = '20', groupByParent } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};

  // groupByParent mode: only top-level (non-child) items
  if (groupByParent === 'true') {
    where.parentId = null;
  }

  // Type filter: if explicitly set, use it; otherwise exclude containers
  if (type && type !== 'all') {
    where.type = type;
  } else {
    where.type = { not: 'container' };
  }

  if (search) {
    where.OR = [
      { uniqueCode: { contains: String(search), mode: 'insensitive' } },
      { nameCn: { contains: String(search), mode: 'insensitive' } },
      { nameEn: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        parts: true,
        containedIn: { include: { container: { select: { id: true, uniqueCode: true } } } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// GET /api/items/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      parts: true,
      parent: true,
      containerItems: { include: { item: true } },
      containedIn: { include: { container: true } },
    },
  });
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item);
});

// GET /api/items/code/:uniqueCode - public QR landing
router.get('/code/:uniqueCode', async (req, res: Response) => {
  const item = await prisma.item.findUnique({
    where: { uniqueCode: req.params.uniqueCode },
    include: {
      parts: true,
      parent: true,
      containerItems: { include: { item: true } },
      containedIn: { include: { container: true } },
    },
  });
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item);
});

// POST /api/items
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = createItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const isContainer = data.type === 'container';
  const idType = isContainer ? 'C' : 'A';

  const mainCode = await generateUniqueCode(idType);

  const item = await prisma.item.create({
    data: {
      uniqueCode: mainCode,
      type: data.type,
      nameCn: data.nameCn,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      weightGross: data.weightGross,
      weightNet: data.weightNet,
      length: data.length,
      width: data.width,
      height: data.height,
      isContainer,
      createdBy: req.userId!,
    },
  });

  // Create parts for complex items
  if (data.type === 'complex' && data.parts && data.parts.length > 0) {
    const partCodes = await generatePartCodes(data.parts.length);
    for (let i = 0; i < data.parts.length; i++) {
      await prisma.item.create({
        data: {
          uniqueCode: partCodes[i],
          type: 'simple',
          nameCn: data.parts[i].nameCn,
          nameEn: data.parts[i].nameEn,
          nameAr: data.parts[i].nameAr,
          partDescription: data.parts[i].partDescription,
          weightGross: data.parts[i].weightGross,
          weightNet: data.parts[i].weightNet,
          length: data.parts[i].length,
          width: data.parts[i].width,
          height: data.parts[i].height,
          parentId: item.id,
          createdBy: req.userId!,
        },
      });
    }
  }

  const full = await prisma.item.findUnique({
    where: { id: item.id },
    include: { parts: true },
  });

  res.status(201).json(full);
});

// PUT /api/items/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const { parts, ...itemData } = data as Record<string, unknown>;

  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: {
      ...(itemData as Record<string, unknown>),
      isContainer: itemData.type === 'container',
    } as Record<string, unknown>,
  });

  res.json(item);
});

// DELETE /api/items/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  // Delete child parts first
  await prisma.item.deleteMany({ where: { parentId: req.params.id } });
  // Remove from any container (where this item is the container OR the contained item)
  await prisma.containerItem.deleteMany({ where: { containerId: req.params.id } });
  await prisma.containerItem.deleteMany({ where: { itemId: req.params.id } });
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
