import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateOrderUseCase } from '../../../application/use-cases/order/CreateOrder.js';
import { PrismaOrderRepository } from '../../../infrastructure/repositories/PrismaOrderRepository.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaShippingRateRepository } from '../../../infrastructure/repositories/PrismaShippingRateRepository.js';

export class OrderController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { items, customerInfo } = request.body as any;

    const orderRepo = new PrismaOrderRepository();
    const productRepo = new PrismaProductRepository();
    const shippingRepo = new PrismaShippingRateRepository();
    
    const useCase = new CreateOrderUseCase(orderRepo, productRepo, shippingRepo as any);

    try {
      const order = await useCase.execute({ userId, items, customerInfo });
      return reply.status(201).send(order);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
