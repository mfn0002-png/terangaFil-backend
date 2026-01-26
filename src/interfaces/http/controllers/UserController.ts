import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { CreateUserUseCase } from '../../../application/use-cases/auth/CreateUser.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';
import bcrypt from 'bcrypt';

export class UserController {
  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, email, phoneNumber, password, role } = request.body as any;

    const userRepository = new PrismaUserRepository();
    const createUserUseCase = new CreateUserUseCase(userRepository);

    try {
      const user = await createUserUseCase.execute({ 
        name, 
        email, 
        phoneNumber, 
        password, 
        role 
      });
      return reply.status(201).send(user);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getMe = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: { 
        supplier: {
          include: { subscriptions: { include: { plan: true }, where: { status: 'ACTIVE' } } }
        }
      }
    });

    if (!user) {
      return reply.status(404).send({ message: 'Utilisateur non trouvé.' });
    }

    return reply.send(user);
  };

  updateMe = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { name, email, phoneNumber } = request.body as any;

    try {
      const updatedUser = await (prisma as any).user.update({
        where: { id: userId },
        data: { name, email, phoneNumber }
      });
      return reply.send(updatedUser);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { currentPassword, newPassword } = request.body as any;

    try {
      const user = await (prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Utilisateur non trouvé.');

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
         return reply.status(400).send({ message: 'L’ancien mot de passe est incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await (prisma as any).user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return reply.send({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };
}
