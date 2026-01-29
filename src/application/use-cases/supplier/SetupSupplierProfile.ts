import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class SetupSupplierProfileUseCase {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(data: { userId: number; shopName: string; description?: string; logoUrl?: string; bannerUrl?: string }) {
    const existingSupplier = await this.supplierRepository.findByUserId(data.userId);
    
    if (existingSupplier) {
      throw new Error('Un profil fournisseur existe déjà pour cet utilisateur.');
    }

    const supplier = await this.supplierRepository.create(data);

    // Assigner le plan FREE par défaut
    const freePlan = await (prisma as any).plan.findUnique({ where: { name: 'FREE' } });
    if (freePlan) {
      await (prisma as any).subscription.create({
        data: {
          supplierId: supplier.id,
          planId: freePlan.id,
          status: 'ACTIVE',
        }
      });
    }

    return supplier;
  }
}
