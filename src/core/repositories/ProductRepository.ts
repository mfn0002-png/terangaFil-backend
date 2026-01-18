import { Product } from '../entities/Product.js';

export interface ProductRepository {
  create(data: { supplierId: number; name: string; price: number; stock: number; category: string }): Promise<Product>;
  findById(id: number): Promise<Product | null>;
  listBySupplier(supplierId: number): Promise<Product[]>;
  listAll(): Promise<Product[]>;
  updateStock(id: number, quantity: number): Promise<Product>;
}
