import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';

const router = Router();

router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);
router.post('/', projectController.createProject);

export default router;
