import { Router } from 'express';
import { register, login, refresh, logout, getMe, verifyEmail, resendVerification } from './auth.controller';
import { requireAuth, optionalAuth } from './auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', optionalAuth, resendVerification);

export { router as authRouter };
