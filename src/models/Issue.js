const mongoose = require('mongoose');

const STATUSES = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'];
const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];
const TYPES = ['bug', 'task', 'story', 'epic'];

const issueSchema = new mongoose.Schema({
  issue_key: {
    type: String,
    required: [true, 'Issue key is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: STATUSES,
      message: 'Status must be one of: ' + STATUSES.join(', ')
    },
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: {
      values: PRIORITIES,
      message: 'Priority must be one of: ' + PRIORITIES.join(', ')
    },
    default: 'medium'
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: TYPES,
      message: 'Type must be one of: ' + TYPES.join(', ')
    }
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

issueSchema.index({ projectId: 1, issue_key: 1 }, { unique: true });
issueSchema.index({ projectId: 1, deleted: 1 });
issueSchema.index({ projectId: 1, status: 1 });
issueSchema.index({ projectId: 1, assignee: 1 });

module.exports = mongoose.model('Issue', issueSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.TYPES = TYPES;
