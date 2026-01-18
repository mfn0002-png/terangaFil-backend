import { prisma } from '../../../infrastructure/database/prisma.js';
export class ListProductsUseCase {
    async execute(filters) {
        // Utilisation de Prisma directement pour gérer les jointures complexes et le tri Premium
        const products = await prisma.product.findMany({
            where: {
                supplierId: filters.supplierId,
                category: filters.category,
                price: {
                    gte: filters.minPrice,
                    lte: filters.maxPrice,
                },
                supplier: {
                    status: 'ACTIVE'
                }
            },
            include: {
                supplier: {
                    include: {
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            include: { plan: true }
                        }
                    }
                }
            },
            orderBy: [
                { isSpotlight: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        // Tri manuel par priorityLevel
        return products.sort((a, b) => {
            const planA = a.supplier?.subscriptions?.[0]?.plan?.priorityLevel || 0;
            const planB = b.supplier?.subscriptions?.[0]?.plan?.priorityLevel || 0;
            if (a.isSpotlight && !b.isSpotlight)
                return -1;
            if (!a.isSpotlight && b.isSpotlight)
                return 1;
            return planB - planA;
        });
    }
}
