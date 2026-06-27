import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/auth/me — returns the currently authenticated user (or null for guests)
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (userId === 'guest') {
    return res.json({ uid: 'guest-user', name: 'Guest', isGuest: true });
  }
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(user);
});

export default router;
