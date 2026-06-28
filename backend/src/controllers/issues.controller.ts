import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Issue from '../models/Issue';
import User from '../models/User';
import { analyzeIssueImage, analyzeIssueText, checkDuplicate } from '../services/gemini.service';
import { uploadImageBuffer } from '../services/cloudinary.service';
import { io } from '../index';

// Haversine distance in meters
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate priority score from multiple signals
function calcPriorityScore(
  severity: string,
  votes: number,
  verifications: number,
  ageHours: number
): number {
  const sevWeights: Record<string, number> = { Critical: 40, High: 30, Medium: 20, Low: 10 };
  const sevScore = sevWeights[severity] || 10;
  const voteScore = Math.min(votes * 1.5, 25);
  const verifyScore = Math.min(verifications * 3, 20);
  const ageDecay = Math.max(0, 15 - ageHours * 0.1);
  return Math.round(Math.min(100, sevScore + voteScore + verifyScore + ageDecay));
}
async function getOrCreateGuestUser() {
  let guest = await User.findOne({ uid: 'guest-user' });
  if (!guest) {
    guest = await User.create({
      uid: 'guest-user',
      name: 'Guest',
      email: 'guest@civicsense.app',
      role: 'citizen',
    });
  }
  return guest._id;
}

export async function createIssue(req: Request, res: Response) {
  try {
    const { description, lat, lng, address, city, ward } = req.body;
   const rawUserId = (req as any).userId;
const userId = rawUserId === 'guest' ? await getOrCreateGuestUser() : rawUserId;
    const file = req.file as any;

    // AI Analysis
    let analysis;
    if (file) {
      analysis = await analyzeIssueImage(file.buffer, file.mimetype, city || 'Jaipur', description);
    } else if (description) {
      analysis = await analyzeIssueText(description, city || 'Jaipur');
    } else {
      return res.status(400).json({ error: 'Provide an image or description' });
    }

    // Check for duplicates within 100m
    const nearby = await Issue.find({
      location: {
        $near: { $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: 100 },
      },
      status: { $ne: 'resolved' },
    }).select('_id title category');

    const dupCheck = await checkDuplicate(
      analysis.title,
      analysis.category,
      nearby.map((n) => ({ id: n._id.toString(), title: n.title, category: n.category }))
    );

    if (dupCheck.isDuplicate && dupCheck.duplicateId) {
      // Auto-upvote the duplicate instead
      await Issue.findByIdAndUpdate(dupCheck.duplicateId, {
        $addToSet: { votes: userId },
      });
      return res.json({
        duplicate: true,
        existingIssueId: dupCheck.duplicateId,
        message: 'Similar issue already reported — your vote has been added!',
      });
    }

    const priorityScore = calcPriorityScore(analysis.severity, 0, 0, 0);

    // Only hit Cloudinary once we know this isn't a duplicate report.
    const media = file
      ? [
          await uploadImageBuffer(file.buffer).then(({ url, publicId }) => ({
            url,
            publicId,
            type: 'image' as const,
          })),
        ]
      : [];

    const issue = await Issue.create({
      title: analysis.title,
      description: analysis.description,
      category: analysis.category,
      severity: analysis.severity,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address,
        ward,
        city: city || 'Jaipur',
      },
      media,
      reportedBy: userId,
      department: analysis.department,
      priorityScore,
      aiAnalysis: {
        category: analysis.category,
        severity: analysis.severity,
        confidence: analysis.confidence,
        suggestedDepartment: analysis.department,
        estimatedFixDays: analysis.estimatedFixDays,
      },
    });

    // Award points (+50 for reporting) — goes through .save() so badge tier
    // actually recalculates (see User.awardPoints / models/User.ts)
    await User.awardPoints(userId, { points: 50, issuesReported: 1 });

    // Broadcast to city room in real-time
    io.to(city || 'Jaipur').emit('new-issue', {
      _id: issue._id,
      title: issue.title,
      severity: issue.severity,
      location: issue.location,
    });

    const populated = await issue.populate('reportedBy', 'name avatar badge');
    res.status(201).json({ issue: populated, aiAnalysis: analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
}

export async function getIssues(req: Request, res: Response) {
  try {
    const {
      lat, lng, radius = '5000',
      category, severity, status,
      sort = '-createdAt',
      page = '1', limit = '20',
      city,
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (city) filter['location.city'] = city;

    let query;
    if (lat && lng) {
      query = Issue.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      });
    } else {
      query = Issue.find(filter).sort(sort);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      query.skip(skip).limit(parseInt(limit)).populate('reportedBy', 'name avatar badge'),
      // NOTE: when lat/lng are passed, `total`/`pages` are computed against
      // `filter` only (no $near), so they reflect the city-wide count, not
      // the in-radius count — that's intentionally the safer option. $near
      // is a find()-only operator; countDocuments() runs through an
      // aggregation $match stage that does NOT support it, so adding it
      // here would throw rather than just be imprecise. Nothing in the
      // frontend currently calls this with lat/lng, so it's not user-facing
      // yet — if a "near me" view gets built, switch this whole branch to
      // a $geoNear aggregation stage (which supports $facet for paginated
      // results + count together) instead of patching countDocuments.
      Issue.countDocuments(filter),
    ]);

    res.json({ issues, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
}

export async function getIssueById(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name avatar badge points')
      .populate('verifiedBy', 'name avatar');
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
}

export async function voteIssue(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Not found' });

    const hasVoted = issue.votes.includes(userId);
    if (hasVoted) {
      issue.votes = issue.votes.filter((v) => v.toString() !== userId.toString());
      // Reverse the +10 given to the reporter when the vote is retracted —
      // previously this never happened, so repeatedly toggling a vote
      // on/off could inflate the reporter's points without limit.
      await User.awardPoints(issue.reportedBy, { points: -10 });
    } else {
      issue.votes.push(userId);
      // Award +10 points to reporter
      await User.awardPoints(issue.reportedBy, { points: 10 });
    }
    issue.voteCount = issue.votes.length;

    // Recalculate priority score
    const ageHours = (Date.now() - issue.createdAt.getTime()) / 3600000;
    issue.priorityScore = calcPriorityScore(
      issue.severity,
      issue.votes.length,
      issue.verifiedBy.length,
      ageHours
    );

    await issue.save();
    io.to(issue.location.city).emit('issue-updated', { _id: issue._id, votes: issue.votes.length, priorityScore: issue.priorityScore });
    res.json({ votes: issue.votes.length, priorityScore: issue.priorityScore, voted: !hasVoted });
  } catch (err) {
    res.status(500).json({ error: 'Vote failed' });
  }
}

export async function verifyIssue(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Not found' });
    if (issue.reportedBy.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot verify your own issue' });
    }

    const alreadyVerified = issue.verifiedBy.includes(userId);
    if (!alreadyVerified) {
      issue.verifiedBy.push(userId);
      const ageHours = (Date.now() - issue.createdAt.getTime()) / 3600000;
      issue.priorityScore = calcPriorityScore(
        issue.severity, issue.votes.length, issue.verifiedBy.length, ageHours
      );
      await issue.save();
      // +15 points for verifying
      await User.awardPoints(userId, { points: 15, issuesVerified: 1 });
    }

    res.json({ verifiedBy: issue.verifiedBy.length, priorityScore: issue.priorityScore });
  } catch (err) {
    res.status(500).json({ error: 'Verify failed' });
  }
}

export async function getHeatmapData(req: Request, res: Response) {
  try {
    const { city = 'Jaipur', days = '30' } = req.query as Record<string, string>;
    const since = new Date(Date.now() - parseInt(days) * 86400000);

    const data = await Issue.aggregate([
      { $match: { 'location.city': city, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.coordinates.1', 3] },
            lng: { $round: ['$location.coordinates.0', 3] },
          },
          count: { $sum: 1 },
          severity: { $first: '$severity' },
        },
      },
      { $project: { lat: '$_id.lat', lng: '$_id.lng', count: 1, severity: 1, _id: 0 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Heatmap failed' });
  }
}
