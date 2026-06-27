import { Router, Request, Response } from 'express';
import Issue from '../models/Issue';
import User from '../models/User';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { city = 'Jaipur' } = req.query as { city: string };
    const monthStart = new Date(Date.now() - 30 * 86400000);

    const [open, resolved, total, byCategory, bySeverity, recentTrend] = await Promise.all([
      Issue.countDocuments({ 'location.city': city, status: 'open' }),
      Issue.countDocuments({ 'location.city': city, status: 'resolved', resolvedAt: { $gte: monthStart } }),
      Issue.countDocuments({ 'location.city': city }),
      Issue.aggregate([
        { $match: { 'location.city': city } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([
        { $match: { 'location.city': city } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { 'location.city': city, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ open, resolved, total, byCategory, bySeverity, recentTrend });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

export default router;
