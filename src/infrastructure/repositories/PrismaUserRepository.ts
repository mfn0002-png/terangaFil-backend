import { prisma } from '../database/prisma.js';
import { User } from '../../core/entities/User.js';
import { UserRepository } from '../../core/repositories/UserRepository.js';
import { Role } from '@prisma/client';

export class PrismaUserRepository implements UserRepository {
  async create(data: { name: string; email?: string | null; phoneNumber: string; passwordHash: string; role: Role }): Promise<User> {
    const user: any = await (prisma as any).user.create({
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.passwordHash,
        role: data.role,
      },
    });
    return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
  }

  async findByEmail(email: string | null): Promise<User | null> {
    if (!email) return null;
    const user: any = await (prisma as any).user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user: any = await (prisma as any).user.findUnique({
      where: { phoneNumber },
    });
    if (!user) return null;
    return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
  }

  async findById(id: number): Promise<User | null> {
    const user: any = await (prisma as any).user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
  }
}
