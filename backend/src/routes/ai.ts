import { Router, Request, Response } from 'express';
import { chatWithCivicAI, generatePredictiveInsights } from '../services/gemini.service';
import Issue from '../models/Issue';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, city = 'Jaipur' } = req.body;

    const [open, resolved, members] = await Promise.all([
      Issue.countDocuments({ 'location.city': city, status: { $ne: 'resolved' } }),
      Issue.countDocuments({
        'location.city': city,
        status: 'resolved',
        resolvedAt: { $gte: new Date(Date.now() - 30 * 86400000) },
      }),
      // Approximate with issue count as proxy if no user count available
      Issue.distinct('reportedBy', { 'location.city': city }).then((r) => r.length),
    ]);

    const reply = await chatWithCivicAI(messages, city, {
      open,
      resolved,
      members,
      avgResolutionDays: 8,
    });

    res.json({ reply });
 } catch (err: any) {
  console.error('AI CHAT ERROR:', err);
  if (err?.status === 503 || err?.status === 429) {
    return res.status(503).json({ error: 'AI is busy right now, please try again in a moment.' });
  }
  res.status(500).json({ error: 'Chat failed' });
}
});

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { city = 'Jaipur' } = req.query as { city: string };
    const since = new Date(Date.now() - 30 * 86400000);
    const prevSince = new Date(Date.now() - 60 * 86400000);

    const [current, previous] = await Promise.all([
      Issue.aggregate([
        { $match: { 'location.city': city, createdAt: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { 'location.city': city, createdAt: { $gte: prevSince, $lt: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const prevMap = Object.fromEntries(previous.map((p) => [p._id, p.count]));
    const trends = current.map((c) => ({
      category: c._id,
      count: c.count,
      growthRate: prevMap[c._id]
        ? Math.round(((c.count - prevMap[c._id]) / prevMap[c._id]) * 100)
        : 100,
    }));

    const insights = await generatePredictiveInsights(city, trends);
    res.json({ insights, trends });
  } catch (err: any) {
    console.error('AI INSIGHTS ERROR:', err);
    if (err?.status === 503 || err?.status === 429) {
      return res.status(503).json({ error: 'AI is busy right now, please try again in a moment.' });
    }
    res.status(500).json({ error: 'Insights failed' });
  }
});

export default router;
