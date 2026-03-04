const Project = require('../models/Project');

const generateIssueKey = async (projectId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $inc: { issueCounter: 1 } },
    { new: true }
  );
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  return `${project.key}-${project.issueCounter}`;
};

module.exports = { generateIssueKey };
