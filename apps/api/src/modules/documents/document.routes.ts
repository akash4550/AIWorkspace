import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from './document.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';

const router = Router();
const controller = new DocumentController();

// Use memory storage for simplicity, allowing our StorageProvider to handle physical disk writing or S3 upload.
// For extremely large files, we'd use diskStorage with a temp directory.
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.use(requireAuth);

router.post('/', upload.single('file'), controller.upload.bind(controller));
router.post('/:id/version', upload.single('file'), controller.uploadVersion.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getOne.bind(controller));
router.get('/:id/versions', controller.getVersions.bind(controller));
router.patch('/:id/rename', controller.rename.bind(controller));
router.patch('/:id/move', controller.move.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
