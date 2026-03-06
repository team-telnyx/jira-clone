import { describe, it, expect } from 'vitest';
import { CreateProjectSchema } from '../validators/projectValidator.js';

describe('CreateProjectSchema', () => {
  it('should validate valid input with all required fields', () => {
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

  it('should validate input with optional description', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
      description: 'A test project description',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A test project description');
    }
  });

  it('should reject missing name', () => {
    const input = {
      prefix: 'TEST',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing prefix', () => {
    const input = {
      name: 'Test Project',
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

  it('should reject name longer than 100 characters', () => {
    const input = {
      name: 'a'.repeat(101),
      prefix: 'TST',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject prefix longer than 10 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TOOLONGPREFIX',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject prefix shorter than 2 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'T',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should convert prefix to uppercase', () => {
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

  it('should reject description longer than 500 characters', () => {
    const input = {
      name: 'Test Project',
      prefix: 'TEST',
      description: 'a'.repeat(501),
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
