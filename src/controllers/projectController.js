const { Project } = require('../models/Project');

/**
 * Error response helper
 */
function errorResponse(res, error) {
  const status = error.status || 500;
  const response = {
    success: false,
    error: {
      message: error.message,
      status,
    },
  };

  if (error.errors) {
    response.error.errors = error.errors;
  }

  if (error.field) {
    response.error.field = error.field;
  }

  return res.status(status).json(response);
}

/**
 * Success response helper
 */
function successResponse(res, data, status = 200, meta = {}) {
  return res.status(status).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

/**
 * Create a new project
 * POST /api/projects
 */
async function createProject(req, res) {
  try {
    const { name, key, description } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          status: 401,
        },
      });
    }

    const project = Project.create({
      name,
      key,
      description,
      ownerId,
    });

    return successResponse(res, project.toJSON(), 201);
  } catch (error) {
    return errorResponse(res, error);
  }
}

/**
 * Get all projects with pagination
 * GET /api/projects
 */
async function getProjects(req, res) {
  try {
    const { page, limit, ownerId } = req.query;
    
    const result = Project.findAll({
      page,
      limit,
      ownerId,
    });

    return res.status(200).json({
      success: true,
      data: result.data.map(p => p.toJSON()),
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

/**
 * Get a single project by ID or key
 * GET /api/projects/:idOrKey
 */
async function getProject(req, res) {
  try {
    const { idOrKey } = req.params;
    
    // Try to find by key first (more common), then by ID
    let project = Project.findByKey(idOrKey);
    if (!project) {
      project = Project.findById(idOrKey);
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          status: 404,
        },
      });
    }

    return successResponse(res, project.toJSON());
  } catch (error) {
    return errorResponse(res, error);
  }
}

/**
 * Update a project (partial update)
 * PATCH /api/projects/:idOrKey
 */
async function updateProject(req, res) {
  try {
    const { idOrKey } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          status: 401,
        },
      });
    }

    // Find the project
    let project = Project.findByKey(idOrKey);
    if (!project) {
      project = Project.findById(idOrKey);
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          status: 404,
        },
      });
    }

    // Check ownership
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have permission to update this project',
          status: 403,
        },
      });
    }

    // Build update data (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Handle key update attempt
    if (req.body.key !== undefined) {
      updateData.key = req.body.key; // Will be rejected by validation
    }

    const updatedProject = Project.update(project.id, updateData);

    return successResponse(res, updatedProject.toJSON());
  } catch (error) {
    return errorResponse(res, error);
  }
}

/**
 * Delete a project
 * DELETE /api/projects/:idOrKey
 */
async function deleteProject(req, res) {
  try {
    const { idOrKey } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          status: 401,
        },
      });
    }

    // Find the project
    let project = Project.findByKey(idOrKey);
    if (!project) {
      project = Project.findById(idOrKey);
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          status: 404,
        },
      });
    }

    // Check ownership
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have permission to delete this project',
          status: 403,
        },
      });
    }

    Project.delete(project.id);

    return res.status(204).send();
  } catch (error) {
    return errorResponse(res, error);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
