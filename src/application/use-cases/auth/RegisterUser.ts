import bcrypt from 'bcrypt';
import { UserRepository } from '../../../core/repositories/UserRepository.js';
import { Role } from '@prisma/client';

export class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { name: string; email?: string | null; phoneNumber: string; password: string; role: Role }) {
    if (data.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('Cet email est déjà utilisé.');
      }
    }

    const existingPhone = await this.userRepository.findByPhoneNumber(data.phoneNumber);
    if (existingPhone) {
      throw new Error('Ce numéro de téléphone est déjà utilisé.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.userRepository.create({
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      passwordHash,
      role: data.role,
    });
  }
}
