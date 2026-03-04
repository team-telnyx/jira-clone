const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Project key is required'],
    uppercase: true,
    trim: true,
    unique: true,
    match: [/^[A-Z][A-Z0-9]*$/, 'Key must start with a letter and contain only uppercase letters and numbers']
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issueCounter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
