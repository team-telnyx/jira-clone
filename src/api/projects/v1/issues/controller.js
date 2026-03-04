const asyncHandler = require('express-async-handler');
const issueService = require('./service');

const createIssue = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const issue = await issueService.createIssue(projectId, req.validatedBody, req.user.userId);
  res.status(201).json(issue);
});

const listIssues = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await issueService.listIssues(projectId, req.query);
  res.status(200).json(result);
});

const getIssue = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params;
  const issue = await issueService.getIssue(projectId, issueId);
  res.status(200).json(issue);
});

const updateIssue = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params;
  const issue = await issueService.updateIssue(projectId, issueId, req.validatedBody, req.user.userId);
  res.status(200).json(issue);
});

const deleteIssue = asyncHandler(async (req, res) => {
  const { projectId, issueId } = req.params;
  await issueService.deleteIssue(projectId, issueId, req.user.userId);
  res.status(204).send();
});

module.exports = {
  createIssue,
  listIssues,
  getIssue,
  updateIssue,
  deleteIssue
};
