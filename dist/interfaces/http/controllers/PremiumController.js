import { prisma } from '../../../infrastructure/database/prisma.js';
import { SubscribeToPlanUseCase } from '../../../application/use-cases/premium/SubscribeToPlan.js';
import { GetSupplierStatsUseCase } from '../../../application/use-cases/supplier/GetSupplierStats.js';
import { GetPaymentHistoryUseCase } from '../../../application/use-cases/premium/GetPaymentHistory.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
export class PremiumController {
    async listPlans(request, reply) {
        const plans = await prisma.plan.findMany();
        return reply.send(plans);
    }
    async subscribe(request, reply) {
        const { sub: userId } = request.user;
        const { planName, paymentMethod } = request.body;
        const supplierRepo = new PrismaSupplierRepository();
        const useCase = new SubscribeToPlanUseCase(supplierRepo);
        try {
            const subscription = await useCase.execute({ userId, planName, paymentMethod });
            return reply.status(201).send(subscription);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async getMySubscription(request, reply) {
        const { sub: userId } = request.user;
        const supplierRepo = new PrismaSupplierRepository();
        const supplier = await supplierRepo.findByUserId(userId);
        if (!supplier) {
            return reply.status(404).send({ message: 'Fournisseur non trouvé.' });
        }
        const subscription = await prisma.subscription.findFirst({
            where: { supplierId: supplier.id, status: 'ACTIVE' },
            include: { plan: true, payments: true }
        });
        return reply.send(subscription);
    }
    async getStats(request, reply) {
        const { sub: userId } = request.user;
        const useCase = new GetSupplierStatsUseCase();
        try {
            const stats = await useCase.execute(userId);
            return reply.send(stats);
        }
        catch (error) {
            return reply.status(403).send({ message: error.message });
        }
    }
    async getPayments(request, reply) {
        const { sub: userId } = request.user;
        const useCase = new GetPaymentHistoryUseCase();
        try {
            const payments = await useCase.execute(userId);
            return reply.send(payments);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
