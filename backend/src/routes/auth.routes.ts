import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimit } from '../middleware/rateLimit';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

// Throttle credential endpoints to blunt brute-force / signup abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Shume perpjekje. Ju lutem provoni perseri pas pak minutash.',
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
