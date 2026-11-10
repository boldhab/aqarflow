import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { authMiddleware, requireRole, validate } from '@/shared/middleware';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

// Basic rate limiting: 10 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user and issue session cookie
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or inactive user
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register agency and initial admin user
 *     tags: [Auth]
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get currently authenticated user and agency context
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out user and clear session cookie
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Successfully logged out
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/admin-check:
 *   get:
 *     summary: Demo RBAC check requiring ADMIN role
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access confirmed
 *       403:
 *         description: Forbidden
 */
router.get('/admin-check', authMiddleware, requireRole('ADMIN'), authController.adminCheck);

export const authRouter = router;
