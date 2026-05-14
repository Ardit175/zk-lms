import { Router } from 'express';
import {
  verifyCertificate,
  downloadCertificate,
  getMyCertificates,
} from '../controllers/certificate.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public verification endpoint
router.get('/:verificationCode/verify', verifyCertificate);

// Student endpoints
router.get('/my-certificates', requireAuth, requireRole('STUDENT'), getMyCertificates);

router.get('/:id/download', requireAuth, requireRole('STUDENT'), downloadCertificate);

export default router;
