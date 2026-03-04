const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const issuesRouter = require('./projects/v1/issues/router');

router.use('/projects/:projectId/issues', authMiddleware, issuesRouter);

module.exports = router;
