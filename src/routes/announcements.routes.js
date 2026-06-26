import { Router } from 'express';
import * as controller from '../controllers/announcements.controller.js';
import * as validators from '../validators/announcements.validators.js';

const router = Router();

router.get('/', validators.getAnnouncementsValidator, controller.getAnnouncements);
router.get('/:id', validators.idParamValidator, controller.getAnnouncementById);
router.post('/', validators.createAnnouncementValidator, controller.createAnnouncement);
router.patch('/:id', validators.idParamValidator, validators.updateAnnouncementValidator, controller.updateAnnouncement);
router.delete('/:id', validators.idParamValidator, controller.deleteAnnouncement);

export default router;