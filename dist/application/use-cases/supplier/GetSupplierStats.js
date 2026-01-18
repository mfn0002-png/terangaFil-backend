import { prisma } from '../../../infrastructure/database/prisma.js';
export class GetSupplierStatsUseCase {
    async execute(userId) {
        const supplier = await prisma.supplier.findUnique({
            where: { userId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true }
                }
            }
        });
        if (!supplier)
            throw new Error('Fournisseur non trouvé.');
        const subscription = supplier.subscriptions?.[0];
        if (!subscription || !subscription.plan.hasStats) {
            throw new Error('Votre plan actuel ne permet pas d\'accéder aux statistiques avancées.');
        }
        // Calculer les stats
        const totalOrders = await prisma.supplierOrder.count({ where: { supplierId: supplier.id } });
        const totalRevenue = await prisma.orderItem.aggregate({
            where: { product: { supplierId: supplier.id } },
            _sum: { price: true }
        });
        const productPerformance = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: { product: { supplierId: supplier.id } },
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 5
        });
        return {
            totalOrders,
            totalRevenue: totalRevenue._sum.price || 0,
            bestSellers: productPerformance
        };
    }
}
