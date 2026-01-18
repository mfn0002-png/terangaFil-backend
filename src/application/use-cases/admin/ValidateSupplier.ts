import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';
import { SupplierStatus } from '../../../core/entities/Supplier.js';

export class ValidateSupplierUseCase {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(id: number, status: SupplierStatus) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Fournisseur non trouvé.');
    }

    return this.supplierRepository.updateStatus(id, status);
  }
}
