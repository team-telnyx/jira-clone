const request = require('supertest');
const app = require('../src/app');
const { Project } = require('../src/models/Project');

describe('Projects API', () => {
  const testUserId = 'user_test123';
  const otherUserId = 'user_other456';

  beforeEach(() => {
    // Clear all projects before each test
    Project.clearAll();
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        key: 'TEST',
        description: 'A test project',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Project',
        key: 'TEST',
        description: 'A test project',
        ownerId: testUserId,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.links).toBeDefined();
    });

    it('should normalize project key to uppercase', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'test',
          description: 'A test project',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.key).toBe('TEST');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          key: 'TEST',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.errors).toBeDefined();
      expect(response.body.error.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid project key format', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: '123TEST', // Must start with letter
        });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 400 for project key with special characters', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'TEST-1', // Hyphens not allowed
        });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 400 for project key that is too short', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'T', // Must be at least 2 chars
        });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 400 for project key that is too long', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'VERYLONGKEY1', // Max 10 chars
        });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 400 for reserved project key', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'ADMIN',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 409 for duplicate project key', async () => {
      // Create first project
      await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'First Project',
          key: 'PROJ',
        });

      // Try to create second project with same key
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Second Project',
          key: 'PROJ',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create some test projects
      await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({ name: 'Project 1', key: 'PROJ1' });
      
      await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({ name: 'Project 2', key: 'PROJ2' });

      await request(app)
        .post('/api/projects')
        .set('X-User-Id', otherUserId)
        .send({ name: 'Other Project', key: 'OTHER' });
    });

    it('should return all projects with pagination', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalCount).toBe(3);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should filter by ownerId', async () => {
      const response = await request(app)
        .get(`/api/projects?ownerId=${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(p => p.ownerId === testUserId)).toBe(true);
    });

    it('should return empty array when no projects exist', async () => {
      Project.clearAll();
      
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /api/projects/:idOrKey', () => {
    let createdProject;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'TEST',
          description: 'A test project',
        });
      createdProject = response.body.data;
    });

    it('should return project by key', async () => {
      const response = await request(app)
        .get('/api/projects/TEST');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('TEST');
    });

    it('should return project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${createdProject.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(createdProject.id);
    });

    it('should be case-insensitive for key lookup', async () => {
      const response = await request(app)
        .get('/api/projects/test');

      expect(response.status).toBe(200);
      expect(response.body.data.key).toBe('TEST');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/NOTFOUND');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/projects/:idOrKey', () => {
    let createdProject;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'TEST',
          description: 'Original description',
        });
      createdProject = response.body.data;
    });

    it('should update project name', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', testUserId)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Original description');
    });

    it('should update project description', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', testUserId)
        .send({ description: 'Updated description' });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', testUserId)
        .send({
          name: 'New Name',
          description: 'New description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.description).toBe('New description');
    });

    it('should reject key update (immutable)', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', testUserId)
        .send({ key: 'NEWKEY' });

      expect(response.status).toBe(400);
      expect(response.body.error.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should return 403 when updating another user\'s project', async () => {
      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', otherUserId)
        .send({ name: 'Hacked!' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .patch('/api/projects/NOTFOUND')
        .set('X-User-Id', testUserId)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should update the updatedAt timestamp', async () => {
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .patch('/api/projects/TEST')
        .set('X-User-Id', testUserId)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(new Date(response.body.data.updatedAt).getTime())
        .toBeGreaterThan(new Date(createdProject.createdAt).getTime());
    });
  });

  describe('DELETE /api/projects/:idOrKey', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/projects')
        .set('X-User-Id', testUserId)
        .send({
          name: 'Test Project',
          key: 'TEST',
        });
    });

    it('should delete project by key', async () => {
      const response = await request(app)
        .delete('/api/projects/TEST')
        .set('X-User-Id', testUserId);

      expect(response.status).toBe(204);

      // Verify deletion
      const getResponse = await request(app)
        .get('/api/projects/TEST');
      expect(getResponse.status).toBe(404);
    });

    it('should delete project by ID', async () => {
      // Get the project ID first
      const getResponse = await request(app)
        .get('/api/projects/TEST');
      const projectId = getResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('X-User-Id', testUserId);

      expect(response.status).toBe(204);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/projects/TEST');

      expect(response.status).toBe(401);
    });

    it('should return 403 when deleting another user\'s project', async () => {
      const response = await request(app)
        .delete('/api/projects/TEST')
        .set('X-User-Id', otherUserId);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/NOTFOUND')
        .set('X-User-Id', testUserId);

      expect(response.status).toBe(404);
    });
  });

  describe('Health check', () => {
    it('should return OK status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Project Model', () => {
  const { 
    validateProjectKey, 
    PROJECT_KEY_REGEX, 
    RESERVED_KEYS,
  } = require('../src/models/Project');

  beforeEach(() => {
    Project.clearAll();
  });

  describe('validateProjectKey', () => {
    it('should accept valid keys', () => {
      expect(validateProjectKey('TEST').valid).toBe(true);
      expect(validateProjectKey('AB').valid).toBe(true);
      expect(validateProjectKey('PROJECT1').valid).toBe(true);
      expect(validateProjectKey('A2B3C4').valid).toBe(true);
    });

    it('should normalize to uppercase', () => {
      expect(validateProjectKey('test').key).toBe('TEST');
      expect(validateProjectKey('TeSt').key).toBe('TEST');
    });

    it('should reject keys that don\'t start with a letter', () => {
      expect(validateProjectKey('1TEST').valid).toBe(false);
      expect(validateProjectKey('123').valid).toBe(false);
    });

    it('should reject keys with special characters', () => {
      expect(validateProjectKey('TEST-1').valid).toBe(false);
      expect(validateProjectKey('TEST_1').valid).toBe(false);
      expect(validateProjectKey('TEST 1').valid).toBe(false);
      expect(validateProjectKey('TEST.1').valid).toBe(false);
    });

    it('should reject empty or null keys', () => {
      expect(validateProjectKey('').valid).toBe(false);
      expect(validateProjectKey(null).valid).toBe(false);
      expect(validateProjectKey(undefined).valid).toBe(false);
    });

    it('should reject keys that are too short', () => {
      expect(validateProjectKey('A').valid).toBe(false);
    });

    it('should reject keys that are too long', () => {
      expect(validateProjectKey('ABCDEFGHIJK').valid).toBe(false);
    });

    it('should reject reserved keys', () => {
      RESERVED_KEYS.forEach(key => {
        expect(validateProjectKey(key).valid).toBe(false);
      });
    });
  });

  describe('Project.findAll', () => {
    beforeEach(() => {
      // Create test projects
      Project.create({ name: 'Project 1', key: 'PROJ1', ownerId: 'user1' });
      Project.create({ name: 'Project 2', key: 'PROJ2', ownerId: 'user1' });
      Project.create({ name: 'Project 3', key: 'PROJ3', ownerId: 'user2' });
    });

    it('should return all projects with default pagination', () => {
      const result = Project.findAll();
      expect(result.data).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should filter by ownerId', () => {
      const result = Project.findAll({ ownerId: 'user1' });
      expect(result.data).toHaveLength(2);
    });

    it('should paginate correctly', () => {
      const result = Project.findAll({ page: 2, limit: 1 });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should cap limit at 100', () => {
      const result = Project.findAll({ limit: 200 });
      expect(result.pagination.limit).toBe(100);
    });
  });
});
