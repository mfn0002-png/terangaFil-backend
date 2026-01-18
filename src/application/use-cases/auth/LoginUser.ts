import bcrypt from 'bcrypt';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { UserRepository } from '../../../core/repositories/UserRepository.js';

export class LoginUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { identifier: string; password: string }) {
    // Recherche par email OU par téléphone via casting any pour éviter les erreurs IDE
    const userDb: any = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { email: data.identifier },
          { phoneNumber: data.identifier }
        ]
      }
    });
    
    if (!userDb) {
      throw new Error('Identifiants invalides.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, userDb.password);
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides.');
    }

    return {
      id: userDb.id,
      email: userDb.email,
      name: userDb.name,
      phoneNumber: userDb.phoneNumber,
      role: userDb.role,
    };
  }
}
