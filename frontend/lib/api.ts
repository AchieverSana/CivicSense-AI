import { Router, Request, Response } from 'express';
import { authenticate, requireAuth } from '../middleware/auth';
import User from '../models/User';
import Issue from '../models/Issue';

const router = Router();

// GET /api/users/leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { city = 'Jaipur', limit = '10' } = req.query as Record<string, string>;
    const leaders = await User.find({ city })
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .select('name avatar badge points issuesReported issuesVerified');
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: 'Leaderboard failed' });
  }
});

// GET /api/users/me — must come before /:id so it doesn't get swallowed by the param route
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (userId === 'guest') {
    return res.json({ uid: 'guest-user', name: 'Guest', isGuest: true });
  }
  res.json((req as any).user);
});

// POST /api/users/promote-admin — self-promotion via a secret invite code,
// instead of editing roles manually in MongoDB Atlas. Must be signed in
// first (not guest). The code lives in process.env.ADMIN_INVITE_CODE so it
// can be rotated/removed without a code change — just update the Render
// env var and redeploy.
router.post('/promote-admin', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = (req as any).userId;

    if (!code || code !== process.env.ADMIN_INVITE_CODE) {
      return res.status(403).json({ error: 'Invalid invite code' });
    }

    const user = await User.findByIdAndUpdate(userId, { role: 'admin' }, { new: true }).select(
      'name email role'
    );
    res.json({ message: 'You are now an admin', role: user?.role });
  } catch (err) {
    res.status(500).json({ error: 'Promotion failed' });
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'Not found' });
    const issues = await Issue.find({ reportedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title category severity status priorityScore createdAt');
    res.json({ user, issues });
  } catch (err) {
    res.status(500).json({ error: 'Profile failed' });
  }
});

export default router;
