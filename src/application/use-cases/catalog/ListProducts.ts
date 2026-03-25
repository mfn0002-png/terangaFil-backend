import { prisma } from '../../../infrastructure/database/prisma.js';

export class ListProductsUseCase {
  async execute(filters: { 
    supplierId?: number; 
    category?: string; 
    minPrice?: number; 
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    // Utilisation de Prisma directement pour gérer les jointures complexes et le tri Premium
    const allProducts: any[] = await (prisma as any).product.findMany({
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
    const sortedProducts = allProducts.sort((a, b) => {
      const planA = a.supplier?.subscriptions?.[0]?.plan?.priorityLevel || 0;
      const planB = b.supplier?.subscriptions?.[0]?.plan?.priorityLevel || 0;
      
      if (a.isSpotlight && !b.isSpotlight) return -1;
      if (!a.isSpotlight && b.isSpotlight) return 1;
      
      return planB - planA;
    });

    const total = sortedProducts.length;
    const paginatedProducts = sortedProducts.slice(skip, skip + limit);

    return {
      data: paginatedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
