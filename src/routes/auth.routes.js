import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as validators from '../validators/auth.validator.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validators.registerValidator, authController.register);
router.post('/login', validators.loginValidator, authController.login);
router.post('/refresh', validators.refreshValidator, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;