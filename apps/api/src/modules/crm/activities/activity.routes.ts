import { Router } from 'express';
import { CRMActivityController } from './activity.controller';

const router = Router();
const controller = new CRMActivityController();

router.post('/', controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));

export default router;
