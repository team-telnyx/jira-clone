process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Issue = require('../../src/models/Issue');
const Project = require('../../src/models/Project');
const User = require('../../src/models/User');

let mongoServer;
let authToken;
let testUser;
let testProject;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  testUser = await User.create({
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword123'
  });
  
  testProject = await Project.create({
    name: 'Test Project',
    key: 'TEST',
    description: 'Test project for issues',
    createdBy: testUser._id
  });
  
  authToken = jwt.sign(
    { userId: testUser._id, email: testUser.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Issue.deleteMany({});
  await Project.updateOne({ _id: testProject._id }, { issueCounter: 0 });
});

describe('Issues API Integration Tests', () => {
  
  describe('AC6: POST /api/projects/:projectId/issues', () => {
    it('should create issue with 201 and auto-generated issue_key', async () => {
      const issueData = {
        title: 'Test Issue',
        description: 'This is a test issue',
        status: 'todo',
        priority: 'high',
        type: 'task'
      };
      
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('issue_key');
      expect(response.body.issue_key).toMatch(/^TEST-\d+$/);
      expect(response.body.title).toBe(issueData.title);
      expect(response.body.status).toBe('todo');
    });
    
    it('should auto-populate reporter from authenticated user', async () => {
      const issueData = {
        title: 'Reporter Test Issue',
        description: 'Testing reporter auto-population',
        status: 'backlog',
        priority: 'medium',
        type: 'bug'
      };
      
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueData)
        .expect(201);
      
      expect(response.body.reporter).toBeDefined();
      expect(response.body.reporter.id).toBe(testUser._id.toString());
      expect(response.body.reporter.name).toBe(testUser.name);
    });
    
    it('should auto-generate sequential issue_key per project', async () => {
      const issue1Data = { title: 'First Issue', status: 'todo', type: 'task' };
      const issue2Data = { title: 'Second Issue', status: 'todo', type: 'task' };
      
      const res1 = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(issue1Data)
        .expect(201);
      
      const res2 = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(issue2Data)
        .expect(201);
      
      expect(res1.body.issue_key).toBe('TEST-1');
      expect(res2.body.issue_key).toBe('TEST-2');
    });
  });
  
  describe('AC7: GET /api/projects/:projectId/issues', () => {
    beforeEach(async () => {
      await Issue.create([
        {
          title: 'Issue 1',
          projectId: testProject._id,
          reporter: testUser._id,
          issue_key: 'TEST-1',
          status: 'todo',
          priority: 'high',
          type: 'task'
        },
        {
          title: 'Issue 2',
          projectId: testProject._id,
          reporter: testUser._id,
          issue_key: 'TEST-2',
          status: 'in_progress',
          priority: 'medium',
          type: 'bug',
          assignee: testUser._id
        },
        {
          title: 'Issue 3',
          projectId: testProject._id,
          reporter: testUser._id,
          issue_key: 'TEST-3',
          status: 'done',
          priority: 'low',
          type: 'story'
        }
      ]);
    });
    
    it('should return paginated list with 200', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: expect.any(Number),
        total: 3,
        totalPages: expect.any(Number)
      });
    });
    
    it('should support filtering by status', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues?status=todo`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('todo');
    });
    
    it('should support filtering by priority', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues?priority=high`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });
    
    it('should support filtering by type', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues?type=bug`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('bug');
    });
    
    it('should support filtering by assignee', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues?assignee=${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignee).toBeDefined();
    });
    
    it('should exclude soft-deleted issues by default', async () => {
      const issue = await Issue.findOne({ issue_key: 'TEST-1' });
      issue.deleted = true;
      issue.deletedAt = new Date();
      await issue.save();
      
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(i => !i.deleted)).toBe(true);
    });
  });
  
  describe('AC8: GET /api/projects/:projectId/issues/:issueId', () => {
    let testIssue;
    
    beforeEach(async () => {
      testIssue = await Issue.create({
        title: 'Single Issue Test',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        priority: 'medium',
        type: 'task'
      });
    });
    
    it('should return single issue with 200', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject._id}/issues/${testIssue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testIssue._id.toString());
      expect(response.body).toHaveProperty('title', testIssue.title);
      expect(response.body).toHaveProperty('issue_key', 'TEST-1');
    });
  });
  
  describe('AC9: PUT /api/projects/:projectId/issues/:issueId', () => {
    let testIssue;
    
    beforeEach(async () => {
      testIssue = await Issue.create({
        title: 'Original Title',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        priority: 'low',
        type: 'task'
      });
    });
    
    it('should update issue with 200', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'in_progress',
        priority: 'high'
      };
      
      const response = await request(app)
        .put(`/api/projects/${testProject._id}/issues/${testIssue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.issue_key).toBe('TEST-1');
    });
    
    it('should update updated_by field with authenticated user', async () => {
      const updateData = { title: 'Updated with new user' };
      
      const response = await request(app)
        .put(`/api/projects/${testProject._id}/issues/${testIssue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.updated_by).toBeDefined();
      expect(response.body.updated_by.id).toBe(testUser._id.toString());
    });
  });
  
  describe('AC10: DELETE /api/projects/:projectId/issues/:issueId', () => {
    let testIssue;
    
    beforeEach(async () => {
      testIssue = await Issue.create({
        title: 'To Delete',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        priority: 'medium',
        type: 'task'
      });
    });
    
    it('should soft-delete issue with 204', async () => {
      await request(app)
        .delete(`/api/projects/${testProject._id}/issues/${testIssue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
      
      const issue = await Issue.findById(testIssue._id);
      expect(issue.deleted).toBe(true);
      expect(issue.deletedAt).toBeDefined();
    });
  });
  
  describe('AC11: Input Validation - 400 Bad Request', () => {
    it('should return 400 for missing required title field', async () => {
      const invalidData = {
        description: 'Missing title',
        status: 'todo',
        type: 'task'
      };
      
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('title');
    });
    
    it('should return 400 for invalid status value', async () => {
      const invalidData = {
        title: 'Test Issue',
        status: 'invalid_status',
        type: 'task'
      };
      
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body.error.message).toContain('status');
    });
    
    it('should return 400 for non-existent assignee user', async () => {
      const invalidData = {
        title: 'Test Issue',
        status: 'todo',
        type: 'task',
        assignee: new mongoose.Types.ObjectId()
      };
      
      const response = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body.error.message).toContain('assignee');
    });
  });
  
  describe('AC12: Authentication - 401 Unauthorized', () => {
    it('should return 401 without JWT token', async () => {
      await request(app)
        .get(`/api/projects/${testProject._id}/issues`)
        .expect(401);
    });
    
    it('should return 401 with invalid JWT token', async () => {
      await request(app)
        .get(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
    
    it('should return 401 with expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );
      
      await request(app)
        .get(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
  
  describe('AC13: Not Found - 404 Errors', () => {
    it('should return 404 for non-existent issue', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/projects/${testProject._id}/issues/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
    
    it('should return 404 for non-existent project', async () => {
      const nonExistentProjectId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/projects/${nonExistentProjectId}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
    
    it('should return 404 when issue belongs to different project', async () => {
      const otherProject = await Project.create({
        name: 'Other Project',
        key: 'OTHER',
        description: 'Different project',
        createdBy: testUser._id
      });
      
      const issue = await Issue.create({
        title: 'Issue in test project',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      });
      
      await request(app)
        .get(`/api/projects/${otherProject._id}/issues/${issue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
  
  describe('EC: Edge Cases', () => {
    it('should handle concurrent issue creation with unique sequential keys', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        request(app)
          .post(`/api/projects/${testProject._id}/issues`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Issue ${i}`,
            status: 'todo',
            type: 'task'
          })
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(res => {
        expect(res.status).toBe(201);
      });
      
      const issueKeys = responses.map(r => r.body.issue_key);
      const uniqueKeys = [...new Set(issueKeys)];
      expect(uniqueKeys).toHaveLength(10);
      
      const numbers = issueKeys.map(k => parseInt(k.split('-')[1])).sort((a, b) => a - b);
      for (let i = 0; i < numbers.length; i++) {
        expect(numbers[i]).toBe(i + 1);
      }
    });
    
    it('should allow same issue_key in different projects', async () => {
      const project2 = await Project.create({
        name: 'Project 2',
        key: 'PROJ2',
        description: 'Second project',
        createdBy: testUser._id
      });
      
      const res1 = await request(app)
        .post(`/api/projects/${testProject._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Issue in project 1', status: 'todo', type: 'task' })
        .expect(201);
      
      const res2 = await request(app)
        .post(`/api/projects/${project2._id}/issues`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Issue in project 2', status: 'todo', type: 'task' })
        .expect(201);
      
      expect(res1.body.issue_key).toBe('TEST-1');
      expect(res2.body.issue_key).toBe('PROJ2-1');
    });
  });
});
