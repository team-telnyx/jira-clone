const express = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all projects with optional pagination and filtering
 * @access  Public (with optional auth for owner filtering)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   ownerId - Filter by owner ID
 */
router.get('/', optionalAuth, getProjects);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (requires authentication)
 * @body    name - Project name (required)
 * @body    key - Project key, e.g., 'PROJ' (required, uppercase alphanumeric)
 * @body    description - Project description (optional)
 */
router.post('/', authMiddleware, createProject);

/**
 * @route   GET /api/projects/:idOrKey
 * @desc    Get a single project by ID or key
 * @access  Public
 * @param   idOrKey - Project ID or key
 */
router.get('/:idOrKey', getProject);

/**
 * @route   PATCH /api/projects/:idOrKey
 * @desc    Update a project (partial update)
 * @access  Private (requires authentication + ownership)
 * @param   idOrKey - Project ID or key
 * @body    name - New project name (optional)
 * @body    description - New project description (optional)
 * @note    Project key cannot be changed after creation
 */
router.patch('/:idOrKey', authMiddleware, updateProject);

/**
 * @route   DELETE /api/projects/:idOrKey
 * @desc    Delete a project
 * @access  Private (requires authentication + ownership)
 * @param   idOrKey - Project ID or key
 */
router.delete('/:idOrKey', authMiddleware, deleteProject);

module.exports = router;
