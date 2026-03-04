import { Router } from 'express';
import * as issueController from '../controllers/issueController.js';

const router = Router({ mergeParams: true });

router.get('/', issueController.listIssues);
router.get('/:issueId', issueController.getIssue);
router.post('/', issueController.createIssue);
router.put('/:issueId', issueController.updateIssue);
router.patch('/:issueId/move', issueController.moveIssueStatus);
router.delete('/:issueId', issueController.deleteIssue);

export default router;
