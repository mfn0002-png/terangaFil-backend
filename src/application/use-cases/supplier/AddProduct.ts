import { ProductRepository } from '../../../core/repositories/ProductRepository.js';
import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class AddProductUseCase {
  constructor(
    private productRepository: ProductRepository,
    private supplierRepository: SupplierRepository
  ) {}

  async execute(data: { userId: number; name: string; price: number; stock: number; category: string }) {
    const supplier = await this.supplierRepository.findByUserId(data.userId);
    
    if (!supplier) {
      throw new Error('Seuls les fournisseurs peuvent ajouter des produits.');
    }

    if (supplier.status !== 'ACTIVE') {
      throw new Error('Votre compte fournisseur doit être activé par un administrateur pour ajouter des produits.');
    }

    // 1. Récupérer l'abonnement actif et le plan
    const subscription: any = await (prisma as any).subscription.findFirst({
      where: { supplierId: supplier.id, status: 'ACTIVE' },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Aucun abonnement actif trouvé. Veuillez souscrire à un plan.');
    }

    // 2. Vérifier la limite de produits
    const productCount = await prisma.product.count({
      where: { supplierId: supplier.id }
    });

    if (productCount >= subscription.plan.productLimit) {
      throw new Error(`Limite de produits atteinte pour votre plan ${subscription.plan.name} (${subscription.plan.productLimit} produits). Passez au niveau supérieur pour en ajouter d'autres.`);
    }

    return this.productRepository.create({
      supplierId: supplier.id,
      name: data.name,
      price: data.price,
      stock: data.stock,
      category: data.category,
    });
  }
}
