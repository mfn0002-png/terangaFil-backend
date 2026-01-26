import { prisma } from '../../../infrastructure/database/prisma.js';

export class GetSupplierStatsUseCase {
  async execute(userId: number) {
    const supplier: any = await prisma.supplier.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      } as any
    });

    if (!supplier) throw new Error('Fournisseur non trouvé.');
    
    const subscription = supplier.subscriptions?.[0];
    // Basic stats always available, advanced only for hasStats
    const hasAdvancedStats = subscription?.plan.hasBadge || subscription?.plan.hasStats;

    // 1. Total & Revenue
    const totalOrders = await prisma.supplierOrder.count({ where: { supplierId: supplier.id } });
    const pendingOrders = await prisma.supplierOrder.count({ 
      where: { supplierId: supplier.id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } 
    });
    
    // Revenue logic: total of OrderItems corresponding to this supplier's products
    const revenueStats = await prisma.orderItem.aggregate({
      where: { product: { supplierId: supplier.id } },
      _sum: { price: true }
    });

    // 2. Alertes Stock (Low < 10)
    const lowStockCount = await (prisma as any).product.count({
      where: { 
        supplierId: supplier.id,
        stock: { lt: 10 },
        isActive: true
      }
    });

    // 3. Best Sellers (Advanced)
    const bestSellers = hasAdvancedStats ? await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { product: { supplierId: supplier.id } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5
    }) : [];

    return {
      overview: {
        totalOrders,
        pendingOrders,
        totalRevenue: revenueStats._sum.price || 0,
        lowStockItems: lowStockCount
      },
      bestSellers,
      hasAdvancedStats
    };
  }
}
