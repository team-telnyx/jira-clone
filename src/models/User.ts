import { v4 as uuidv4 } from 'uuid';
import type { User } from '../types/index.js';

const users: Map<string, User> = new Map();

export const SEEDED_USER_1_ID = '550e8400-e29b-41d4-a716-446655440001';
export const SEEDED_USER_2_ID = '550e8400-e29b-41d4-a716-446655440002';

export function seedUsers(): void {
  const defaultUsers: User[] = [
    {
      id: SEEDED_USER_1_ID,
      email: 'john@example.com',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: SEEDED_USER_2_ID,
      email: 'jane@example.com',
      name: 'Jane Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  defaultUsers.forEach(user => users.set(user.id, user));
}

export function findUserById(id: string): User | null {
  return users.get(id) ?? null;
}

export function createUser(data: { email: string; name: string }): User {
  const user: User = {
    id: uuidv4(),
    email: data.email,
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export function getAllUsers(): User[] {
  return Array.from(users.values());
}

seedUsers();
