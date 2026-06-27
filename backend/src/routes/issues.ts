import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  createIssue,
  getIssues,
  getIssueById,
  voteIssue,
  verifyIssue,
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
router.post('/:id/vote', authenticate, voteIssue);
router.post('/:id/verify', authenticate, verifyIssue);
router.get('/:id/report', authenticate, generateIssueReport);

export default router;
