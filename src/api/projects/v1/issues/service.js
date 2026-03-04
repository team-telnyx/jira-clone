const Issue = require('../../../../models/Issue');
const Project = require('../../../../models/Project');
const User = require('../../../../models/User');
const { generateIssueKey } = require('../../../../utils/generateIssueKey');
const { AppError } = require('../../../../middleware/errorHandler');

const validateProjectExists = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
};

const validateUserExists = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('assignee user not found', 400);
  }
  return user;
};

const formatIssueResponse = (issue) => {
  const response = {
    id: issue._id.toString(),
    issue_key: issue.issue_key,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    projectId: issue.projectId.toString(),
    created_at: issue.createdAt,
    updated_at: issue.updatedAt
  };
  
  if (issue.reporter) {
    if (typeof issue.reporter === 'object' && issue.reporter._id) {
      response.reporter = {
        id: issue.reporter._id.toString(),
        name: issue.reporter.name,
        email: issue.reporter.email
      };
    } else {
      response.reporter = { id: issue.reporter.toString() };
    }
  }
  
  if (issue.assignee) {
    if (typeof issue.assignee === 'object' && issue.assignee._id) {
      response.assignee = {
        id: issue.assignee._id.toString(),
        name: issue.assignee.name,
        email: issue.assignee.email
      };
    } else {
      response.assignee = { id: issue.assignee.toString() };
    }
  }
  
  if (issue.updated_by) {
    if (typeof issue.updated_by === 'object' && issue.updated_by._id) {
      response.updated_by = {
        id: issue.updated_by._id.toString(),
        name: issue.updated_by.name
      };
    } else {
      response.updated_by = { id: issue.updated_by.toString() };
    }
  }
  
  if (issue.deleted) {
    response.deleted = issue.deleted;
    response.deletedAt = issue.deletedAt;
  }
  
  return response;
};

const createIssue = async (projectId, issueData, userId) => {
  await validateProjectExists(projectId);
  
  if (issueData.assignee) {
    await validateUserExists(issueData.assignee);
  }
  
  const issueKey = await generateIssueKey(projectId);
  
  const issue = await Issue.create({
    ...issueData,
    issue_key: issueKey,
    projectId,
    reporter: userId
  });
  
  const populatedIssue = await Issue.findById(issue._id)
    .populate('reporter', 'name email')
    .populate('assignee', 'name email');
  
  return formatIssueResponse(populatedIssue);
};

const listIssues = async (projectId, queryParams) => {
  await validateProjectExists(projectId);
  
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    type,
    assignee,
    includeDeleted = false
  } = queryParams;
  
  const filter = { projectId };
  
  if (!includeDeleted) {
    filter.deleted = { $ne: true };
  }
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (assignee) filter.assignee = assignee;
  
  const skip = (page - 1) * limit;
  
  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Issue.countDocuments(filter)
  ]);
  
  return {
    data: issues.map(formatIssueResponse),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getIssue = async (projectId, issueId) => {
  await validateProjectExists(projectId);
  
  const issue = await Issue.findOne({ _id: issueId, projectId })
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('updated_by', 'name');
  
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  
  return formatIssueResponse(issue);
};

const updateIssue = async (projectId, issueId, updateData, userId) => {
  await validateProjectExists(projectId);
  
  if (updateData.assignee) {
    await validateUserExists(updateData.assignee);
  }
  
  const issue = await Issue.findOneAndUpdate(
    { _id: issueId, projectId },
    { 
      ...updateData,
      updated_by: userId
    },
    { new: true, runValidators: true }
  )
    .populate('reporter', 'name email')
    .populate('assignee', 'name email')
    .populate('updated_by', 'name');
  
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  
  return formatIssueResponse(issue);
};

const deleteIssue = async (projectId, issueId, userId) => {
  await validateProjectExists(projectId);
  
  const issue = await Issue.findOneAndUpdate(
    { _id: issueId, projectId },
    { 
      deleted: true, 
      deletedAt: new Date(),
      updated_by: userId
    },
    { new: true }
  );
  
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  
  return true;
};

module.exports = {
  createIssue,
  listIssues,
  getIssue,
  updateIssue,
  deleteIssue
};
