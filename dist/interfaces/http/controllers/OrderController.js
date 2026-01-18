import { CreateOrderUseCase } from '../../../application/use-cases/order/CreateOrder.js';
import { PrismaOrderRepository } from '../../../infrastructure/repositories/PrismaOrderRepository.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaShippingRateRepository } from '../../../infrastructure/repositories/PrismaShippingRateRepository.js';
export class OrderController {
    async create(request, reply) {
        const { sub: userId } = request.user;
        const { items, shippingZone } = request.body;
        const orderRepo = new PrismaOrderRepository();
        const productRepo = new PrismaProductRepository();
        const shippingRepo = new PrismaShippingRateRepository();
        const useCase = new CreateOrderUseCase(orderRepo, productRepo, shippingRepo);
        try {
            const order = await useCase.execute({ userId, items, shippingZone });
            return reply.status(201).send(order);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
