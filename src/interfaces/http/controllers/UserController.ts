import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { CreateUserUseCase } from '../../../application/use-cases/auth/CreateUser.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';

export class UserController {
  async create(request: FastifyRequest, reply: FastifyReply) {
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
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const { sub: userId } = request.user as { sub: string };
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
  }

  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    const { sub: userId } = request.user as { sub: string };
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
  }
}
