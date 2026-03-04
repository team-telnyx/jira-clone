const { v4: uuidv4 } = require('uuid');

/**
 * Project key validation rules:
 * - Must start with a letter (A-Z)
 * - Allowed characters: A-Z and 0-9 only
 * - Length: 2-10 characters
 * - Stored in uppercase
 */
const PROJECT_KEY_REGEX = /^[A-Z][A-Z0-9]+$/;
const PROJECT_KEY_MIN_LENGTH = 2;
const PROJECT_KEY_MAX_LENGTH = 10;
const PROJECT_NAME_MAX_LENGTH = 255;
const PROJECT_DESCRIPTION_MAX_LENGTH = 4000;

// Reserved project keys that cannot be used
const RESERVED_KEYS = ['API', 'ADMIN', 'NEW', 'ALL', 'NONE', 'SYSTEM', 'ROOT'];

/**
 * In-memory storage for projects (will be replaced with database in production)
 */
const projects = new Map();

/**
 * Validates a project key according to Jira standards
 * @param {string} key - The project key to validate
 * @returns {{ valid: boolean, error?: string, key?: string }}
 */
function validateProjectKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Project key is required' };
  }

  const normalizedKey = key.toUpperCase().trim();

  if (normalizedKey.length < PROJECT_KEY_MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Project key must be at least ${PROJECT_KEY_MIN_LENGTH} characters`,
    };
  }

  if (normalizedKey.length > PROJECT_KEY_MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Project key must not exceed ${PROJECT_KEY_MAX_LENGTH} characters`,
    };
  }

  if (!PROJECT_KEY_REGEX.test(normalizedKey)) {
    return { 
      valid: false, 
      error: 'Project key must start with a letter and contain only letters and numbers',
    };
  }

  if (RESERVED_KEYS.includes(normalizedKey)) {
    return { 
      valid: false, 
      error: `Project key "${normalizedKey}" is reserved and cannot be used`,
    };
  }

  return { valid: true, key: normalizedKey };
}

/**
 * Validates project data for creation
 * @param {Object} data - Project data to validate
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }> }}
 */
function validateProjectData(data) {
  const errors = [];

  // Validate name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Project name is required' });
  } else if (data.name.length > PROJECT_NAME_MAX_LENGTH) {
    errors.push({ 
      field: 'name', 
      message: `Project name must not exceed ${PROJECT_NAME_MAX_LENGTH} characters`,
    });
  }

  // Validate key
  if (!data.key) {
    errors.push({ field: 'key', message: 'Project key is required' });
  } else {
    const keyValidation = validateProjectKey(data.key);
    if (!keyValidation.valid) {
      errors.push({ field: 'key', message: keyValidation.error });
    }
  }

  // Validate description (optional but has max length)
  if (data.description && data.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.push({ 
      field: 'description', 
      message: `Project description must not exceed ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
    });
  }

  // Validate ownerId
  if (!data.ownerId || typeof data.ownerId !== 'string') {
    errors.push({ field: 'ownerId', message: 'Project owner is required' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates project data for update (partial data allowed)
 * @param {Object} data - Project data to validate
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }> }}
 */
function validateProjectUpdateData(data) {
  const errors = [];

  // Validate name if provided
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Project name cannot be empty' });
    } else if (data.name.length > PROJECT_NAME_MAX_LENGTH) {
      errors.push({ 
        field: 'name', 
        message: `Project name must not exceed ${PROJECT_NAME_MAX_LENGTH} characters`,
      });
    }
  }

  // Key cannot be updated (immutable)
  if (data.key !== undefined) {
    errors.push({ field: 'key', message: 'Project key cannot be changed after creation' });
  }

  // Validate description if provided
  if (data.description !== undefined && data.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.push({ 
      field: 'description', 
      message: `Project description must not exceed ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Project model class
 */
class Project {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.key = data.key.toUpperCase().trim();
    this.name = data.name.trim();
    this.description = data.description || '';
    this.ownerId = data.ownerId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Converts project to plain object for JSON serialization
   */
  toJSON() {
    return {
      id: this.id,
      key: this.key,
      name: this.name,
      description: this.description,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      links: {
        self: `/api/projects/${this.key}`,
        issues: `/api/projects/${this.key}/issues`,
      },
    };
  }

  /**
   * Creates a new project
   * @param {Object} data - Project data
   * @returns {Project}
   * @throws {Error} If validation fails or key already exists
   */
  static create(data) {
    const validation = validateProjectData(data);
    if (!validation.valid) {
      const error = new Error('Validation failed');
      error.status = 400;
      error.errors = validation.errors;
      throw error;
    }

    const normalizedKey = data.key.toUpperCase().trim();

    // Check for duplicate key
    if (Project.findByKey(normalizedKey)) {
      const error = new Error(`Project with key "${normalizedKey}" already exists`);
      error.status = 409;
      error.field = 'key';
      throw error;
    }

    const project = new Project(data);
    projects.set(project.id, project);
    return project;
  }

  /**
   * Finds all projects with optional pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @param {string} options.ownerId - Filter by owner
   * @returns {{ data: Project[], pagination: Object }}
   */
  static findAll(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let projectList = Array.from(projects.values());

    // Filter by owner if specified
    if (options.ownerId) {
      projectList = projectList.filter(p => p.ownerId === options.ownerId);
    }

    // Sort by createdAt descending (newest first)
    projectList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalCount = projectList.length;
    const paginatedData = projectList.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Finds a project by ID
   * @param {string} id - Project ID
   * @returns {Project|null}
   */
  static findById(id) {
    return projects.get(id) || null;
  }

  /**
   * Finds a project by key
   * @param {string} key - Project key
   * @returns {Project|null}
   */
  static findByKey(key) {
    if (!key) return null;
    const normalizedKey = key.toUpperCase().trim();
    return Array.from(projects.values()).find(p => p.key === normalizedKey) || null;
  }

  /**
   * Updates a project
   * @param {string} id - Project ID
   * @param {Object} data - Update data
   * @returns {Project}
   * @throws {Error} If project not found or validation fails
   */
  static update(id, data) {
    const project = projects.get(id);
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    const validation = validateProjectUpdateData(data);
    if (!validation.valid) {
      const error = new Error('Validation failed');
      error.status = 400;
      error.errors = validation.errors;
      throw error;
    }

    // Update allowed fields
    if (data.name !== undefined) {
      project.name = data.name.trim();
    }
    if (data.description !== undefined) {
      project.description = data.description;
    }
    
    project.updatedAt = new Date().toISOString();
    
    return project;
  }

  /**
   * Deletes a project
   * @param {string} id - Project ID
   * @returns {boolean} True if deleted
   * @throws {Error} If project not found
   */
  static delete(id) {
    const project = projects.get(id);
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    return projects.delete(id);
  }

  /**
   * Clears all projects (for testing)
   */
  static clearAll() {
    projects.clear();
  }

  /**
   * Gets the count of all projects
   * @returns {number}
   */
  static count() {
    return projects.size;
  }
}

module.exports = {
  Project,
  validateProjectKey,
  validateProjectData,
  validateProjectUpdateData,
  PROJECT_KEY_REGEX,
  PROJECT_KEY_MIN_LENGTH,
  PROJECT_KEY_MAX_LENGTH,
  RESERVED_KEYS,
};
