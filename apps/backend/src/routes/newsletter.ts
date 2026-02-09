import { Router, type Request, type Response, type IRouter } from 'express';

const router: IRouter = Router();

// Basic email format validation (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter/subscribe - Dummy endpoint, no persistence
router.post('/subscribe', (req: Request, res: Response) => {
  const { email } = req.body as { email?: unknown };

  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Email is required',
    });
    return;
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    res.status(400).json({
      success: false,
      error: 'Email is required',
    });
    return;
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    res.status(400).json({
      success: false,
      error: 'Please enter a valid email address',
    });
    return;
  }

  // Dummy success - no database or external service integration
  res.status(200).json({
    success: true,
    message: 'Thanks for subscribing!',
  });
});

export default router;
