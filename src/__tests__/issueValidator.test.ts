import { describe, it, expect } from 'vitest';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  PaginationSchema,
  IssueFiltersSchema,
  SortSchema,
} from '../validators/issueValidator.js';

describe('CreateIssueSchema', () => {
  it('should validate valid input with all required fields', () => {
    const input = {
      title: 'Test Issue',
      type: 'bug',
      reporterId: '550e8400-e29b-41d4-a716-446655440000',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test Issue');
      expect(result.data.status).toBe('backlog');
      expect(result.data.priority).toBe('medium');
    }
  });
  
  it('should reject missing title', () => {
    const input = {
      type: 'bug',
      reporterId: '550e8400-e29b-41d4-a716-446655440000',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject title exceeding 255 characters', () => {
    const input = {
      title: 'a'.repeat(256),
      type: 'bug',
      reporterId: '550e8400-e29b-41d4-a716-446655440000',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject description exceeding 5000 characters', () => {
    const input = {
      title: 'Test Issue',
      description: 'a'.repeat(5001),
      type: 'bug',
      reporterId: '550e8400-e29b-41d4-a716-446655440000',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject invalid type', () => {
    const input = {
      title: 'Test Issue',
      type: 'invalid',
      reporterId: '550e8400-e29b-41d4-a716-446655440000',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject invalid UUID for reporterId', () => {
    const input = {
      title: 'Test Issue',
      type: 'bug',
      reporterId: 'invalid-uuid',
    };
    
    const result = CreateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should accept all valid enum values for status', () => {
    const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'closed'];
    
    statuses.forEach(status => {
      const input = {
        title: 'Test Issue',
        type: 'bug',
        status,
        reporterId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      const result = CreateIssueSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
  
  it('should accept all valid enum values for priority', () => {
    const priorities = ['lowest', 'low', 'medium', 'high', 'highest'];
    
    priorities.forEach(priority => {
      const input = {
        title: 'Test Issue',
        type: 'bug',
        priority,
        reporterId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      const result = CreateIssueSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
  
  it('should accept all valid enum values for type', () => {
    const types = ['bug', 'task', 'story', 'epic'];
    
    types.forEach(type => {
      const input = {
        title: 'Test Issue',
        type,
        reporterId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      const result = CreateIssueSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('UpdateIssueSchema', () => {
  it('should accept empty object (no-op update)', () => {
    const result = UpdateIssueSchema.safeParse({});
    expect(result.success).toBe(true);
  });
  
  it('should accept partial updates', () => {
    const input = { status: 'in_progress' };
    const result = UpdateIssueSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should allow null for assigneeId (unassign)', () => {
    const input = { assigneeId: null };
    const result = UpdateIssueSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should reject unknown fields', () => {
    const input = { unknownField: 'value' };
    const result = UpdateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject empty title', () => {
    const input = { title: '' };
    const result = UpdateIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('should parse valid page and limit', () => {
    const result = PaginationSchema.safeParse({ page: '2', limit: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });
  
  it('should use defaults when not provided', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });
  
  it('should cap limit at 100', () => {
    const result = PaginationSchema.safeParse({ limit: '500' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });
  
  it('should reject non-numeric page', () => {
    const result = PaginationSchema.safeParse({ page: 'abc' });
    expect(result.success).toBe(false);
  });
});

describe('IssueFiltersSchema', () => {
  it('should parse valid filters', () => {
    const input = {
      status: 'in_progress',
      priority: 'high',
      type: 'bug',
    };
    
    const result = IssueFiltersSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should accept search query', () => {
    const input = { q: 'search term' };
    const result = IssueFiltersSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid status', () => {
    const result = IssueFiltersSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('SortSchema', () => {
  it('should parse valid sort params', () => {
    const result = SortSchema.safeParse({ sortBy: 'priority', sortOrder: 'asc' });
    expect(result.success).toBe(true);
  });
  
  it('should use defaults when not provided', () => {
    const result = SortSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    }
  });
  
  it('should reject invalid sortBy', () => {
    const result = SortSchema.safeParse({ sortBy: 'invalid' });
    expect(result.success).toBe(false);
  });
});
