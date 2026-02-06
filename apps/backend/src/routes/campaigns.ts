import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { requireAuth, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();
const requireSponsor = [requireAuth, roleMiddleware(['SPONSOR'])];

// GET /api/campaigns - List campaigns (scoped to current sponsor)
router.get('/', requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { status } = req.query;

    const campaigns = await prisma.campaign.findMany({
      where: {
        sponsorId: req.user.sponsorId,
        ...(status && { status: status as string as 'ACTIVE' | 'PAUSED' | 'COMPLETED' }),
      },
      include: {
        sponsor: { select: { id: true, name: true, logo: true } },
        _count: { select: { creatives: true, placements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id - Get single campaign (ownership check)
router.get('/:id', requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        sponsor: true,
        creatives: true,
        placements: {
          include: {
            adSlot: true,
            publisher: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.sponsorId !== req.user.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create campaign for current sponsor
router.post('/', requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const {
      name,
      description,
      budget,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
      sponsorId: bodySponsorId,
    } = req.body;

    if (!name || !budget || !startDate || !endDate) {
      res.status(400).json({
        error: 'Name, budget, startDate, and endDate are required',
      });
      return;
    }

    if (bodySponsorId && bodySponsorId !== req.user.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        budget,
        cpmRate,
        cpcRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCategories: targetCategories || [],
        targetRegions: targetRegions || [],
        sponsorId: req.user.sponsorId,
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

const CAMPAIGN_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
] as const;

// PUT /api/campaigns/:id - Update campaign (ownership check)
router.put('/:id', requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const existing = await prisma.campaign.findFirst({
      where: { id, sponsorId: req.user.sponsorId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const {
      name,
      description,
      budget,
      spent,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
      status,
    } = req.body;

    if (budget != null) {
      const b = Number(budget);
      if (Number.isNaN(b) || b <= 0) {
        res.status(400).json({ error: 'budget must be a positive number' });
        return;
      }
    }
    if (spent != null) {
      const s = Number(spent);
      if (Number.isNaN(s) || s < 0) {
        res.status(400).json({ error: 'spent must be a non-negative number' });
        return;
      }
    }
    if (startDate != null && endDate != null) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        res.status(400).json({ error: 'endDate must be on or after startDate' });
        return;
      }
    }
    if (status != null && !CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])) {
      res.status(400).json({
        error: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}`,
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description ?? null;
    if (budget != null) data.budget = budget;
    if (spent != null) data.spent = spent;
    if (cpmRate !== undefined) data.cpmRate = cpmRate ?? null;
    if (cpcRate !== undefined) data.cpcRate = cpcRate ?? null;
    if (startDate != null) data.startDate = new Date(startDate);
    if (endDate != null) data.endDate = new Date(endDate);
    if (targetCategories !== undefined) data.targetCategories = Array.isArray(targetCategories) ? targetCategories : [];
    if (targetRegions !== undefined) data.targetRegions = Array.isArray(targetRegions) ? targetRegions : [];
    if (status !== undefined) data.status = status;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: data as Parameters<typeof prisma.campaign.update>[0]['data'],
      include: {
        sponsor: { select: { id: true, name: true, logo: true } },
        _count: { select: { creatives: true, placements: true } },
      },
    });

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id - Delete campaign (ownership check)
router.delete('/:id', requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const id = getParam(req.params.id);
    const existing = await prisma.campaign.findFirst({
      where: { id, sponsorId: req.user.sponsorId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
