import { UserRepository } from '../../../core/repositories/UserRepository.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { name: string; email?: string | null; phoneNumber: string; password: string; role: Role }) {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error('User already exists');
      }
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    return this.userRepository.create({
      ...data,
      passwordHash
    });
  }
}
