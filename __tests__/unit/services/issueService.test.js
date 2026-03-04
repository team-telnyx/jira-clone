process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Issue = require('../../../src/models/Issue');
const Project = require('../../../src/models/Project');
const User = require('../../../src/models/User');
const { generateIssueKey } = require('../../../src/utils/generateIssueKey');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Issue.deleteMany({});
  await Project.deleteMany({});
  await User.deleteMany({});
});

describe('Issue Service Unit Tests', () => {
  
  describe('generateIssueKey utility', () => {
    it('should return PROJECT-N format', async () => {
      const project = await Project.create({
        name: 'Test Project',
        key: 'PROJ',
        description: 'Test'
      });
      
      const key = await generateIssueKey(project._id);
      expect(key).toMatch(/^PROJ-\d+$/);
    });
    
    it('should increment number sequentially', async () => {
      const project = await Project.create({
        name: 'Test Project',
        key: 'TEST',
        description: 'Test'
      });
      
      const key1 = await generateIssueKey(project._id);
      const key2 = await generateIssueKey(project._id);
      const key3 = await generateIssueKey(project._id);
      
      expect(key1).toBe('TEST-1');
      expect(key2).toBe('TEST-2');
      expect(key3).toBe('TEST-3');
    });
    
    it('should maintain separate counters per project', async () => {
      const project1 = await Project.create({
        name: 'Project 1',
        key: 'P1',
        description: 'Test'
      });
      
      const project2 = await Project.create({
        name: 'Project 2',
        key: 'P2',
        description: 'Test'
      });
      
      const key1a = await generateIssueKey(project1._id);
      const key2a = await generateIssueKey(project2._id);
      const key1b = await generateIssueKey(project1._id);
      
      expect(key1a).toBe('P1-1');
      expect(key2a).toBe('P2-1');
      expect(key1b).toBe('P1-2');
    });
  });
  
  describe('Issue Model Validation', () => {
    let testProject;
    let testUser;
    
    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@test.com',
        name: 'Test User',
        password: 'password123'
      });
      
      testProject = await Project.create({
        name: 'Test Project',
        key: 'TEST',
        description: 'Test',
        createdBy: testUser._id
      });
    });
    
    it('should validate required title field', async () => {
      const issue = new Issue({
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/title/i);
    });
    
    it('should validate required reporter field', async () => {
      const issue = new Issue({
        title: 'Test',
        projectId: testProject._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/reporter/i);
    });
    
    it('should validate required projectId field', async () => {
      const issue = new Issue({
        title: 'Test',
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/projectId/i);
    });
    
    it('should validate required issue_key field', async () => {
      const issue = new Issue({
        title: 'Test',
        projectId: testProject._id,
        reporter: testUser._id,
        status: 'todo',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/issue_key/i);
    });
    
    it('should reject invalid status enum values', async () => {
      const issue = new Issue({
        title: 'Test',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'invalid_status',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/status/i);
    });
    
    it('should accept valid status enum values', async () => {
      const validStatuses = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'];
      
      for (const status of validStatuses) {
        const issue = new Issue({
          title: 'Test',
          projectId: testProject._id,
          reporter: testUser._id,
          issue_key: `TEST-${status}`,
          status: status,
          type: 'task'
        });
        
        await issue.validate();
      }
    });
    
    it('should reject invalid priority enum values', async () => {
      const issue = new Issue({
        title: 'Test',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        priority: 'invalid_priority',
        type: 'task'
      });
      
      await expect(issue.validate()).rejects.toThrow(/priority/i);
    });
    
    it('should reject invalid type enum values', async () => {
      const issue = new Issue({
        title: 'Test',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'invalid_type'
      });
      
      await expect(issue.validate()).rejects.toThrow(/type/i);
    });
    
    it('should enforce unique issue_key per project', async () => {
      const issueData = {
        title: 'Test',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      };
      
      await Issue.create(issueData);
      
      const duplicateIssue = new Issue(issueData);
      await expect(duplicateIssue.save()).rejects.toThrow();
    });
    
    it('should allow same issue_key across different projects', async () => {
      const project2 = await Project.create({
        name: 'Project 2',
        key: 'PROJ2',
        description: 'Test',
        createdBy: testUser._id
      });
      
      await Issue.create({
        title: 'Issue 1',
        projectId: testProject._id,
        reporter: testUser._id,
        issue_key: 'TEST-1',
        status: 'todo',
        type: 'task'
      });
      
      const issue2 = await Issue.create({
        title: 'Issue 2',
        projectId: project2._id,
        reporter: testUser._id,
        issue_key: 'PROJ2-1',
        status: 'todo',
        type: 'task'
      });
      
      expect(issue2.issue_key).toBe('PROJ2-1');
    });
  });
});
