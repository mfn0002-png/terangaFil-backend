import { User } from '../entities/User.js';
import { Role } from '@prisma/client';

export interface UserRepository {
  create(data: { name: string; email?: string | null; phoneNumber: string; passwordHash: string; role: Role }): Promise<User>;
  findByEmail(email: string | null): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
}
