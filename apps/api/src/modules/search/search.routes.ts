import { Router } from 'express';

import { requireAuth } from '../../core/middlewares/authMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../core/utils/asyncWrapper';
import { SearchController } from './search.controller';
import { GlobalSearchSchema } from './search.dto';

const router = Router();
const controller = new SearchController();

router.use(requireAuth);

router.get(
  '/',
  validateRequest(GlobalSearchSchema),
  asyncWrapper(controller.globalSearch.bind(controller)),
);

export default router;