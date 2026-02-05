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
// BUG: This accepts 'dimensions' and 'pricingModel' fields that don't exist in Prisma schema
// BUG: No input validation for basePrice (could be negative or zero)
router.post('/', requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { name, description, type, position, width, height, basePrice, cpmFloor, publisherId: bodyPublisherId } =
      req.body;

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

// TODO: Add PUT /api/ad-slots/:id endpoint
// TODO: Add DELETE /api/ad-slots/:id endpoint

export default router;
