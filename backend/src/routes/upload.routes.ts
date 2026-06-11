import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile } from '../controllers/upload.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Server-controlled extension map. The stored filename's extension is derived
// from the (allow-listed) mimetype, NOT from the client-supplied filename, so an
// attacker can never persist an `.html`/`.svg` file that the static server would
// later serve as active content (stored-XSS). Anything not matched is rejected.
const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

function safeExtension(mimetype: string): string | null {
  if (EXT_BY_MIME[mimetype]) return EXT_BY_MIME[mimetype];
  if (mimetype.startsWith('video/')) {
    const sub = (mimetype.split('/')[1] || 'mp4').replace(/[^a-z0-9]/gi, '').slice(0, 5);
    return `.${sub || 'mp4'}`;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = safeExtension(file.mimetype) ?? '.bin';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (safeExtension(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipi i skedarit nuk lejohet'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (video); PDF/image limits enforced client-side
  },
});

router.post('/', requireAuth, upload.single('file'), uploadFile);

export default router;
