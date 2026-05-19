import { Router } from 'express';
import multer from 'multer';
import {
  generateQuiz,
  summarizeContent,
  extractPdf,
  extractYoutube,
  extractAudio,
} from '../controllers/ai.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — matches Whisper hard limit
});

router.post(
  '/quiz-generator/generate',
  requireAuth,
  requireRole('INSTRUCTOR'),
  generateQuiz
);

router.post(
  '/content-summarizer/summarize',
  requireAuth,
  requireRole('INSTRUCTOR'),
  summarizeContent
);

router.post(
  '/extract/pdf',
  requireAuth,
  requireRole('INSTRUCTOR'),
  memoryUpload.single('file'),
  extractPdf
);

router.post(
  '/extract/youtube',
  requireAuth,
  requireRole('INSTRUCTOR'),
  extractYoutube
);

router.post(
  '/extract/audio',
  requireAuth,
  requireRole('INSTRUCTOR'),
  memoryUpload.single('file'),
  extractAudio
);

export default router;
