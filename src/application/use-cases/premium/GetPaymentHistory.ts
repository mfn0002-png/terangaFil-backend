import { prisma } from '../../../infrastructure/database/prisma.js';

export class GetPaymentHistoryUseCase {
  async execute(userId: number) {
    const supplier = await prisma.supplier.findUnique({
      where: { userId }
    });

    if (!supplier) throw new Error('Fournisseur non trouvé.');

    return (prisma as any).subscriptionPayment.findMany({
      where: {
        subscription: {
          supplierId: supplier.id
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
