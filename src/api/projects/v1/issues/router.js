const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./controller');
const validate = require('../../../../middleware/validate');
const { createIssueSchema, updateIssueSchema } = require('./validation');

router.post('/', validate(createIssueSchema), controller.createIssue);
router.get('/', controller.listIssues);
router.get('/:issueId', controller.getIssue);
router.put('/:issueId', validate(updateIssueSchema), controller.updateIssue);
router.delete('/:issueId', controller.deleteIssue);

module.exports = router;
