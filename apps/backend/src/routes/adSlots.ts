import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { requireAuth, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();
const requirePublisher = [requireAuth, roleMiddleware(['PUBLISHER'])];

const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;

// GET /api/ad-slots - List ad slots (scoped to current publisher)
router.get('/', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { type, available } = req.query;

    const adSlots = await prisma.adSlot.findMany({
      where: {
        publisherId: req.user.publisherId,
        ...(type &&
          AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number]) && {
            type: type as (typeof AD_SLOT_TYPES)[number],
          }),
        ...(available === 'true' && { isAvailable: true }),
      },
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
      orderBy: { basePrice: 'desc' },
    });

    res.json(adSlots);
  } catch (error) {
    console.error('Error fetching ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

// GET /api/ad-slots/:id - Get single ad slot (ownership check)
router.get('/:id', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: {
        publisher: true,
        placements: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (adSlot.publisherId !== req.user.publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(adSlot);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

// POST /api/ad-slots - Create new ad slot for current publisher
router.post('/', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { name, description, type, position, width, height, basePrice, cpmFloor, publisherId: bodyPublisherId, dimensions, pricingModel } =
      req.body;

    const invalidFields: string[] = [];
    if (dimensions !== undefined) invalidFields.push('dimensions');
    if (pricingModel !== undefined) invalidFields.push('pricingModel');
    if (invalidFields.length > 0) {
      res.status(400).json({
        error: `Invalid fields: ${invalidFields.join(' and ')} are not allowed`,
      });
      return;
    }

    if (!name || !type || basePrice == null) {
      res.status(400).json({
        error: 'Name, type, and basePrice are required',
      });
      return;
    }

    const numBasePrice = Number(basePrice);
    if (Number.isNaN(numBasePrice) || numBasePrice <= 0) {
      res.status(400).json({ error: 'basePrice must be a positive number' });
      return;
    }

    if (!AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
      res.status(400).json({ error: `type must be one of: ${AD_SLOT_TYPES.join(', ')}` });
      return;
    }

    if (width != null) {
      const w = Number(width);
      if (Number.isNaN(w) || w < 1 || Math.floor(w) !== w) {
        res.status(400).json({ error: 'width must be a positive integer' });
        return;
      }
    }
    if (height != null) {
      const h = Number(height);
      if (Number.isNaN(h) || h < 1 || Math.floor(h) !== h) {
        res.status(400).json({ error: 'height must be a positive integer' });
        return;
      }
    }

    if (bodyPublisherId && bodyPublisherId !== req.user.publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const adSlot = await prisma.adSlot.create({
      data: {
        name,
        description: description ?? undefined,
        type: type as (typeof AD_SLOT_TYPES)[number],
        position: position ?? undefined,
        width: width != null ? Number(width) : undefined,
        height: height != null ? Number(height) : undefined,
        basePrice: numBasePrice,
        cpmFloor: cpmFloor != null ? Number(cpmFloor) : undefined,
        publisherId: req.user.publisherId,
      },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(adSlot);
  } catch (error) {
    console.error('Error creating ad slot:', error);
    res.status(500).json({ error: 'Failed to create ad slot' });
  }
});

// POST /api/ad-slots/:id/book - Book an ad slot (sponsors only)
router.post('/:id/book', requireAuth, roleMiddleware(['SPONSOR']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const id = getParam(req.params.id);
    const { sponsorId: bodySponsorId, message } = req.body;

    if (bodySponsorId && bodySponsorId !== req.user.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check if slot exists and is available
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: { publisher: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (!adSlot.isAvailable) {
      res.status(400).json({ error: 'Ad slot is no longer available' });
      return;
    }

    // Mark slot as unavailable
    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: false },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    // In a real app, you'd create a Placement record here
    // For now, we just mark it as booked
    console.log(`Ad slot ${id} booked by sponsor ${req.user.sponsorId}. Message: ${message || 'None'}`);

    res.json({
      success: true,
      message: 'Ad slot booked successfully!',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error booking ad slot:', error);
    res.status(500).json({ error: 'Failed to book ad slot' });
  }
});

// POST /api/ad-slots/:id/unbook - Reset ad slot to available (publisher who owns the slot only)
router.post('/:id/unbook', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const id = getParam(req.params.id);

    const existing = await prisma.adSlot.findUnique({ where: { id }, select: { publisherId: true } });
    if (!existing) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }
    if (existing.publisherId !== req.user.publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: true },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Ad slot is now available again',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error unbooking ad slot:', error);
    res.status(500).json({ error: 'Failed to unbook ad slot' });
  }
});

// PUT /api/ad-slots/:id - Update ad slot (ownership check)
router.put('/:id', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const existing = await prisma.adSlot.findFirst({
      where: { id, publisherId: req.user.publisherId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    const { name, description, type, position, width, height, basePrice, cpmFloor, isAvailable } = req.body;

    if (basePrice != null) {
      const n = Number(basePrice);
      if (Number.isNaN(n) || n <= 0) {
        res.status(400).json({ error: 'basePrice must be a positive number' });
        return;
      }
    }
    if (type !== undefined && !AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
      res.status(400).json({ error: `type must be one of: ${AD_SLOT_TYPES.join(', ')}` });
      return;
    }
    if (width != null) {
      const w = Number(width);
      if (Number.isNaN(w) || w < 1 || Math.floor(w) !== w) {
        res.status(400).json({ error: 'width must be a positive integer' });
        return;
      }
    }
    if (height != null) {
      const h = Number(height);
      if (Number.isNaN(h) || h < 1 || Math.floor(h) !== h) {
        res.status(400).json({ error: 'height must be a positive integer' });
        return;
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description ?? null;
    if (type !== undefined) data.type = type;
    if (position !== undefined) data.position = position ?? null;
    if (width != null) data.width = Number(width);
    if (height != null) data.height = Number(height);
    if (basePrice != null) data.basePrice = Number(basePrice);
    if (cpmFloor !== undefined) data.cpmFloor = cpmFloor ?? null;
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const adSlot = await prisma.adSlot.update({
      where: { id },
      data: data as Parameters<typeof prisma.adSlot.update>[0]['data'],
      include: {
        publisher: { select: { id: true, name: true, category: true } },
        _count: { select: { placements: true } },
      },
    });

    res.json(adSlot);
  } catch (error) {
    console.error('Error updating ad slot:', error);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});

// DELETE /api/ad-slots/:id - Delete ad slot (ownership check)
router.delete('/:id', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const existing = await prisma.adSlot.findFirst({
      where: { id, publisherId: req.user.publisherId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    await prisma.adSlot.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});

export default router;
