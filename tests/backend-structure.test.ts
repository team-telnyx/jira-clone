import { describe, test, expect, beforeAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..');

describe('Backend Structure Tests', () => {
  describe('AC-1: Package.json Configuration', () => {
    let packageJson: Record<string, unknown>;

    beforeAll(() => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    });

    test('TC-1: should have package.json with required dependencies', () => {
      const requiredDeps = [
        'express',
        'cors',
        'helmet',
        'morgan',
        '@prisma/client',
        'jsonwebtoken',
        'dotenv'
      ];

      expect(packageJson.dependencies).toBeDefined();
      const deps = packageJson.dependencies as Record<string, string>;
      
      requiredDeps.forEach(dep => {
        expect(deps[dep]).toBeDefined();
      });
    });

    test('TC-1: should have package.json with required dev dependencies', () => {
      const requiredDevDeps = [
        'typescript',
        'ts-node',
        '@types/node',
        '@types/express',
        '@types/cors',
        '@types/jsonwebtoken',
        'prisma',
        'jest',
        'ts-jest',
        '@types/jest',
        'supertest',
        '@types/supertest'
      ];

      expect(packageJson.devDependencies).toBeDefined();
      const devDeps = packageJson.devDependencies as Record<string, string>;
      
      requiredDevDeps.forEach(dep => {
        expect(devDeps[dep]).toBeDefined();
      });
    });

    test('TC-5: should have npm scripts configured', () => {
      const requiredScripts = ['dev', 'build', 'start', 'test'];
      const scripts = packageJson.scripts as Record<string, string>;
      
      expect(scripts).toBeDefined();
      
      requiredScripts.forEach(script => {
        expect(scripts[script]).toBeDefined();
      });
      
      expect(scripts.dev).toContain('ts-node');
      expect(scripts.build).toContain('tsc');
      expect(scripts.start).toContain('node');
    });
  });

  describe('AC-2: TypeScript Configuration', () => {
    test('TC-2: should have tsconfig.json', () => {
      const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsConfigPath)).toBe(true);
    });

    test('TC-2: should have correct tsconfig compiler options', () => {
      const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));

      expect(tsConfig.compilerOptions).toBeDefined();
      expect(tsConfig.compilerOptions.target).toBeDefined();
      expect(tsConfig.compilerOptions.module).toBe('commonjs');
      expect(tsConfig.compilerOptions.outDir).toBe('./dist');
      expect(tsConfig.compilerOptions.rootDir).toBe('./src');
      expect(tsConfig.compilerOptions.strict).toBe(true);
      expect(tsConfig.compilerOptions.esModuleInterop).toBe(true);
      expect(tsConfig.include).toContain('src/**/*');
    });
  });

  describe('AC-5: Environment Configuration', () => {
    test('TC-6: should have .env.example file', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
      
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      expect(envContent).toContain('DATABASE_URL');
      expect(envContent).toContain('JWT_SECRET');
      expect(envContent).toContain('PORT');
    });

    test('TC-6: should have .gitignore with .env', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('node_modules');
      expect(gitignoreContent).toContain('dist');
    });
  });

  describe('AC-6: Prisma Configuration', () => {
    test('TC-7: should have prisma directory and schema', () => {
      const prismaDir = path.join(projectRoot, 'prisma');
      const schemaPath = path.join(prismaDir, 'schema.prisma');
      
      expect(fs.existsSync(prismaDir)).toBe(true);
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    test('TC-7: prisma schema should have datasource and generator', () => {
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
      
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        
        expect(schemaContent).toContain('datasource db');
        expect(schemaContent).toContain('provider = "postgresql"');
        expect(schemaContent).toContain('generator client');
      }
    });
  });

  describe('AC-9: JWT Authentication Setup', () => {
    test('TC-9: should have JWT auth dependency', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(pkg.dependencies).toHaveProperty('jsonwebtoken');
      expect(pkg.devDependencies).toHaveProperty('@types/jsonwebtoken');
    });
  });

  describe('AC-10: Directory Structure', () => {
    test('TC-10: should have src directory structure', () => {
      const srcDir = path.join(projectRoot, 'src');
      expect(fs.existsSync(srcDir)).toBe(true);
      expect(fs.statSync(srcDir).isDirectory()).toBe(true);
    });

    test('TC-10: should have src/index.ts entry point', () => {
      const indexPath = path.join(projectRoot, 'src', 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    test('TC-10: should have routes directory', () => {
      const routesDir = path.join(projectRoot, 'src', 'routes');
      expect(fs.existsSync(routesDir)).toBe(true);
    });

    test('TC-10: should have middleware directory', () => {
      const middlewareDir = path.join(projectRoot, 'src', 'middleware');
      expect(fs.existsSync(middlewareDir)).toBe(true);
    });
  });
});
