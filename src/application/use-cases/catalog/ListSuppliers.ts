import { Supplier } from '../../../core/entities/Supplier.js';
import { SupplierRepository } from '../../../core/repositories/SupplierRepository.js';

export class ListSuppliersUseCase {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(): Promise<Supplier[]> {
    const suppliers = await this.supplierRepository.listAll();
    // Filter only ACTIVE suppliers
    return suppliers.filter(s => s.status === 'ACTIVE');
  }
}
