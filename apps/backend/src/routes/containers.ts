import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/containers - list all containers
router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = { type: 'container' };
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
        containerItems: { include: { container: false } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

const addItemsSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive().default(1),
  })),
});

// POST /api/containers/:id/add-items - incremental add items to container
router.post('/:id/add-items', async (req: AuthRequest, res: Response) => {
  const parsed = addItemsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const container = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!container || !container.isContainer) {
    res.status(404).json({ error: 'Container not found' });
    return;
  }

  for (const ci of parsed.data.items) {
    const item = await prisma.item.findUnique({ where: { id: ci.itemId }, select: { type: true } });
    if (!item) continue;
    if (item.type === 'container') continue;

    // Remove from any previous container first (supports re-assignment)
    await prisma.containerItem.deleteMany({ where: { itemId: ci.itemId } });

    await prisma.containerItem.create({
      data: { containerId: req.params.id, itemId: ci.itemId, quantity: ci.quantity },
    });
  }

  const updated = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: { containerItems: { include: { container: false } } },
  });
  res.json(updated);
});

// PUT /api/containers/:id/items - replace all items in container
router.put('/:id/items', async (req: AuthRequest, res: Response) => {
  const parsed = addItemsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const container = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!container || !container.isContainer) {
    res.status(404).json({ error: 'Container not found' });
    return;
  }

  // Validate: reject items already assigned to a different container
  const itemIds = parsed.data.items.map((ci) => ci.itemId);
  const existingAssignments = await prisma.containerItem.findMany({
    where: { itemId: { in: itemIds }, containerId: { not: req.params.id } },
    include: { container: { select: { uniqueCode: true } } },
  });

  if (existingAssignments.length > 0) {
    const conflicts = existingAssignments.map(
      (ea) => `${ea.itemId} (already in ${ea.container.uniqueCode})`,
    );
    res.status(409).json({
      error: 'Some items are already assigned to another container. Use batch transfer from the Item List instead.',
      conflicts,
    });
    return;
  }

  // Replace all container items
  await prisma.containerItem.deleteMany({ where: { containerId: req.params.id } });

  for (const ci of parsed.data.items) {
    await prisma.containerItem.create({
      data: {
        containerId: req.params.id,
        itemId: ci.itemId,
        quantity: ci.quantity,
      },
    });
  }

  const updated = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      containerItems: {
        include: {
          container: false,
        },
      },
    },
  });

  res.json(updated);
});

// GET /api/containers/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const container = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      containerItems: {
        include: {
          container: false,
        },
      },
    },
  });

  if (!container) {
    res.status(404).json({ error: 'Container not found' });
    return;
  }

  // Fetch the actual item details for each container item
  const itemIds = container.containerItems.map((ci) => ci.itemId);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
  });

  const itemsMap = Object.fromEntries(items.map((i) => [i.id, i]));
  const enrichedItems = container.containerItems.map((ci) => ({
    ...ci,
    item: itemsMap[ci.itemId] || null,
  }));

  res.json({ ...container, containerItems: enrichedItems });
});

export default router;
