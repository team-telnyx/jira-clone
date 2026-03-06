import { describe, it, expect } from 'vitest';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from '../validators/projectValidator.js';

describe('CreateProjectSchema', () => {
  it('TC-1: should validate valid project with all required fields', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Project');
      expect(result.data.prefix).toBe('TEST');
    }
  });
  
  it('TC-2: should use default values for optional fields', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
  
  it('should accept description when provided', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
      description: 'A test project for development',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A test project for development');
    }
  });
  
  it('TC-3: should reject missing name', () => {
    const input = {
      prefix: 'TEST',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('TC-4: should reject name exceeding 100 characters', () => {
    const input = {
      name: 'a'.repeat(101),
      prefix: 'TEST',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject empty name', () => {
    const input = {
      name: '',
      prefix: 'TEST',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('TC-5: should reject missing prefix', () => {
    const input = {
      name: 'Test Project',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('TC-6: should reject prefix shorter than 2 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'T',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('TC-7: should reject prefix longer than 10 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TOOLONGPREFIX',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('TC-8: should convert prefix to uppercase', () => {
    const input = {
      name: 'Test Project',
      prefix: 'test',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prefix).toBe('TEST');
    }
  });
  
  it('should accept prefix with exactly 2 characters (boundary)', () => {
    const input = {
      name: 'Test Project',
      prefix: 'ab',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prefix).toBe('AB');
    }
  });
  
  it('should accept prefix with exactly 10 characters (boundary)', () => {
    const input = {
      name: 'Test Project',
      prefix: 'abcdefghij',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prefix).toBe('ABCDEFGHIJ');
    }
  });
  
  it('TC-9: should reject description exceeding 500 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
      description: 'a'.repeat(501),
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should accept description with exactly 500 characters (boundary)', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
      description: 'a'.repeat(500),
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toHaveLength(500);
    }
  });
  
  it('TC-10: should reject prefix with special characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST-1',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject prefix with spaces', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST PROJ',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject prefix with numbers', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST123',
    };
    
    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UpdateProjectSchema', () => {
  it('should accept empty object (no-op update)', () => {
    const result = UpdateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });
  
  it('should accept partial updates', () => {
    const input = { name: 'Updated Name' };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Name');
    }
  });
  
  it('should accept description update', () => {
    const input = { description: 'Updated description' };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should allow description to be null', () => {
    const input = { description: null };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  it('should reject unknown fields', () => {
    const input = { unknownField: 'value' };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject empty name', () => {
    const input = { name: '' };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject name exceeding 100 characters', () => {
    const input = { name: 'a'.repeat(101) };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  it('should reject description exceeding 500 characters', () => {
    const input = { description: 'a'.repeat(501) };
    const result = UpdateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
