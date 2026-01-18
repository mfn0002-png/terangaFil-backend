import { prisma } from '../../../infrastructure/database/prisma.js';
import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';

export class SubscribeToPlanUseCase {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(data: { userId: number; planName: string; paymentMethod: 'STRIPE' | 'MOBILE_MONEY' }) {
    const supplier = await this.supplierRepository.findByUserId(data.userId);
    
    if (!supplier) {
      throw new Error('Fournisseur non trouvé.');
    }

    const plan = await (prisma as any).plan.findUnique({
      where: { name: data.planName }
    });

    if (!plan) {
      throw new Error('Plan non trouvé.');
    }

    // 1. Désactiver les anciens abonnements actifs
    await (prisma as any).subscription.updateMany({
      where: { supplierId: supplier.id, status: 'ACTIVE' },
      data: { status: 'CANCELED' }
    });

    // 2. Créer le nouvel abonnement (durée 30 jours pour l'exemple)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const subscription = await (prisma as any).subscription.create({
      data: {
        supplierId: supplier.id,
        planId: plan.id,
        startDate: new Date(),
        endDate,
        status: 'ACTIVE',
      }
    });

    // 3. Enregistrer le paiement (Simulé pour l'instant)
    await (prisma as any).subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.price,
        paymentMethod: data.paymentMethod,
        status: 'SUCCESS', // On simule le succès immédiat
      }
    });

    return subscription;
  }
}
