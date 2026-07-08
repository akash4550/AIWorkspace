import { Router } from 'express';
import { PipelineStageController } from './pipeline.controller';

const router = Router();
const controller = new PipelineStageController();

router.post('/reorder', controller.reorder.bind(controller));
router.post('/', controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getOne.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
