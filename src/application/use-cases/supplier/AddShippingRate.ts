import { ShippingRateRepository } from '../../../core/repositories/ShippingRateRepository.js';
import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';

export class AddShippingRateUseCase {
  constructor(
    private shippingRateRepository: ShippingRateRepository,
    private supplierRepository: SupplierRepository
  ) {}

  async execute(data: { userId: number; zone: string; price: number; delay: string }) {
    const supplier = await this.supplierRepository.findByUserId(data.userId);
    
    if (!supplier) {
      throw new Error('Profil fournisseur non trouvé.');
    }

    return this.shippingRateRepository.create({
      supplierId: supplier.id,
      zone: data.zone,
      price: data.price,
      delay: data.delay,
    });
  }
}
