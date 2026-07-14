import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import logger from '../logger.js';
import * as authController from '../controllers/auth.controller.js';
import * as validators from '../validators/auth.validator.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    handler: (req, res) => {
        logger.warn(`Перевищено ліміт запитів для IP: ${req.ip}`);
        res.status(429).json({ message: 'Too many requests, please try again later'});
    }
});

router.use(authRateLimiter);

router.post('/register', validators.registerValidator, authController.register);
router.post('/login', validators.loginValidator, authController.login);
router.post('/refresh', validators.refreshValidator, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;