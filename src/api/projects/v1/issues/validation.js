const Joi = require('joi');
const { STATUSES, PRIORITIES, TYPES } = require('../../../../models/Issue');

const createIssueSchema = Joi.object({
  title: Joi.string().required().trim().messages({
    'any.required': 'title is required',
    'string.empty': 'title is required'
  }),
  description: Joi.string().allow('').trim(),
  status: Joi.string().valid(...STATUSES).messages({
    'any.only': 'status must be one of: ' + STATUSES.join(', ')
  }),
  priority: Joi.string().valid(...PRIORITIES).messages({
    'any.only': 'priority must be one of: ' + PRIORITIES.join(', ')
  }),
  type: Joi.string().valid(...TYPES).required().messages({
    'any.required': 'type is required',
    'any.only': 'type must be one of: ' + TYPES.join(', ')
  }),
  assignee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'assignee must be a valid ObjectId'
  })
});

const updateIssueSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().allow('').trim(),
  status: Joi.string().valid(...STATUSES).messages({
    'any.only': 'status must be one of: ' + STATUSES.join(', ')
  }),
  priority: Joi.string().valid(...PRIORITIES).messages({
    'any.only': 'priority must be one of: ' + PRIORITIES.join(', ')
  }),
  type: Joi.string().valid(...TYPES).messages({
    'any.only': 'type must be one of: ' + TYPES.join(', ')
  }),
  assignee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null).messages({
    'string.pattern.base': 'assignee must be a valid ObjectId'
  })
}).min(1);

module.exports = { createIssueSchema, updateIssueSchema };
