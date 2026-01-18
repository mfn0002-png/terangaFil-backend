import { prisma } from '../database/prisma.js';
import { Product } from '../../core/entities/Product.js';
import { ProductRepository } from '../../core/repositories/ProductRepository.js';

export class PrismaProductRepository implements ProductRepository {
  async create(data: { supplierId: number; name: string; price: number; stock: number; category: string }): Promise<Product> {
    const product = await prisma.product.create({
      data,
    });
    return new Product(
      product.id,
      product.supplierId,
      product.name,
      product.price,
      product.stock,
      product.category,
      product.createdAt
    );
  }

  async findById(id: number): Promise<Product | null> {
    const product = await (prisma as any).product.findUnique({ 
      where: { id },
      include: { supplier: true }
    });
    if (!product) return null;
    return product as any;
  }

  async listBySupplier(supplierId: number): Promise<Product[]> {
    const products = await prisma.product.findMany({ where: { supplierId } });
    return products.map(p => new Product(p.id, p.supplierId, p.name, p.price, p.stock, p.category, p.createdAt));
  }

  async listAll(): Promise<Product[]> {
    const products = await prisma.product.findMany();
    return products.map(p => new Product(p.id, p.supplierId, p.name, p.price, p.stock, p.category, p.createdAt));
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: { stock: quantity }
    });
    return new Product(
      product.id,
      product.supplierId,
      product.name,
      product.price,
      product.stock,
      product.category,
      product.createdAt
    );
  }
}
