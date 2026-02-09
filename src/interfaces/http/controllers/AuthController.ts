import { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUser.js';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUser.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import bcrypt from 'bcrypt';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const { name, email, phoneNumber, password, role } = request.body as any;
    const userRepository = new PrismaUserRepository();
    const registerUseCase = new RegisterUserUseCase(userRepository);

    try {
      const user = await registerUseCase.execute({ name, email, phoneNumber, password, role });
      
      // Auto-login : générer le token directement après l'inscription
      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.status(201).send({ token, user });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { identifier, password } = request.body as any;
    const userRepository = new PrismaUserRepository();
    const loginUseCase = new LoginUserUseCase(userRepository);

    try {
      const user = await loginUseCase.execute({ identifier, password });
      
      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.status(200).send({ token, user });
    } catch (error: any) {
      return reply.status(401).send({ message: error.message });
    }
  }

  /**
   * Configure le mot de passe pour un compte invité par l'admin
   */
  async setupPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, password } = request.body as any;

    try {
      const user = await (prisma as any).user.findUnique({
        where: { setupToken: token }
      });

      if (!user) {
        return reply.status(404).send({ message: 'Lien d\'invitation invalide ou expiré' });
      }

      const hash = await bcrypt.hash(password, 10);

      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          password: hash,
          setupToken: null,
          isPasswordSet: true
        }
      });

      return reply.send({ success: true, message: 'Mot de passe configuré avec succès !' });
    } catch (error: any) {
      return reply.status(500).send({ message: 'Erreur lors de la configuration du mot de passe' });
    }
  }
}
