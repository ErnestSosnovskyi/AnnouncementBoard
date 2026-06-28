import { Router } from 'express';
import * as controller from '../controllers/announcements.controller.js';
import * as validators from '../validators/announcements.validators.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', validators.getAnnouncementsValidator, controller.getAnnouncements);
router.get('/:id', validators.idParamValidator, controller.getAnnouncementById);
router.post('/', authenticate, validators.createAnnouncementValidator, controller.createAnnouncement);
router.patch('/:id', authenticate, validators.idParamValidator, validators.updateAnnouncementValidator, controller.updateAnnouncement);
router.delete('/:id', authenticate, validators.idParamValidator, controller.deleteAnnouncement);

export default router;