import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { SubscribeToPlanUseCase } from '../../../application/use-cases/premium/SubscribeToPlan.js';
import { GetSupplierStatsUseCase } from '../../../application/use-cases/supplier/GetSupplierStats.js';
import { GetPaymentHistoryUseCase } from '../../../application/use-cases/premium/GetPaymentHistory.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';

export class PremiumController {
  private getSupplier = async (userId: number) => {
    let supplier = await prisma.supplier.findUnique({ where: { userId } });
    if (!supplier) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'SUPPLIER') {
        supplier = await prisma.supplier.create({
          data: {
            userId,
            shopName: `Boutique de ${user.name.split(' ')[0]}`,
            status: 'ACTIVE'
          }
        });
      } else {
        throw new Error('Fournisseur non trouvé.');
      }
    }
    return supplier;
  };

  listPlans = async (request: FastifyRequest, reply: FastifyReply) => {
    const plans = await (prisma as any).plan.findMany();
    return reply.send(plans);
  };

  subscribe = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { planName, paymentMethod } = request.body as any;

    try {
      const subscription = await new SubscribeToPlanUseCase(new PrismaSupplierRepository()).execute({ userId, planName, paymentMethod });
      return reply.status(201).send(subscription);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getMySubscription = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    
    try {
      const supplier = await this.getSupplier(userId);
      const subscription = await (prisma as any).subscription.findFirst({
        where: { supplierId: supplier.id, status: 'ACTIVE' },
        include: { plan: true, payments: true }
      });
      return reply.send(subscription);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getStats = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const useCase = new GetSupplierStatsUseCase();

    try {
      const stats = await useCase.execute(userId);
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(403).send({ message: error.message });
    }
  };

  getPayments = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const useCase = new GetPaymentHistoryUseCase();

    try {
      const payments = await useCase.execute(userId);
      return reply.send(payments);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };
}
