import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAuth, requireAdmin } from '../middleware/auth';
import {
  createIssue,
  getIssues,
  getIssueById,
  voteIssue,
  verifyIssue,
  resolveIssue,
  getHeatmapData,
} from '../controllers/issues.controller';
import { generateIssueReport } from '../controllers/report.controller';

const router = Router();

// Buffer the upload in memory, then push it straight to Cloudinary in the
// controller — no local disk path is ever created, so there's no /tmp/uploads
// directory to provision and nothing left behind that needs cleanup.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', getIssues);
router.get('/heatmap', getHeatmapData);
router.get('/:id', getIssueById);
router.post('/', authenticate, upload.single('media'), createIssue);
// vote/verify need a real account (not the 'guest' placeholder) — both write
// the current user's id into an ObjectId array, which crashes for guests.
// Voting/verification integrity also matters more than reporting, so
// requiring sign-in here is the right tradeoff, not just a bug workaround.
router.post('/:id/vote', authenticate, requireAuth, voteIssue);
router.post('/:id/verify', authenticate, requireAuth, verifyIssue);
// Resolving is an authority action — only admins can close out an issue.
router.post('/:id/resolve', authenticate, requireAuth, requireAdmin, resolveIssue);
router.get('/:id/report', authenticate, generateIssueReport);

export default router;
