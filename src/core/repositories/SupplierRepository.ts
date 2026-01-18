import { Supplier, SupplierStatus } from '../entities/Supplier.js';

export interface SupplierRepository {
  create(data: { userId: number; shopName: string; description?: string }): Promise<Supplier>;
  findById(id: number): Promise<Supplier | null>;
  findByUserId(userId: number): Promise<Supplier | null>;
  updateStatus(id: number, status: SupplierStatus): Promise<Supplier>;
  listAll(): Promise<Supplier[]>;
}
