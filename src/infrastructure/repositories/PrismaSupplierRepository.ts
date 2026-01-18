import { prisma } from '../database/prisma.js';
import { Supplier, SupplierStatus } from '../../core/entities/Supplier.js';
import { SupplierRepository } from '../../core/repositories/SupplierRepository.js';

export class PrismaSupplierRepository implements SupplierRepository {
  async create(data: { userId: number; shopName: string; description?: string }): Promise<Supplier> {
    const supplier = await prisma.supplier.create({
      data: {
        userId: data.userId,
        shopName: data.shopName,
        description: data.description,
        status: 'PENDING',
      },
    });
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt
    );
  }

  async findById(id: number): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return null;
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt
    );
  }

  async findByUserId(userId: number): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({ where: { userId } });
    if (!supplier) return null;
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt
    );
  }

  async updateStatus(id: number, status: SupplierStatus): Promise<Supplier> {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { status },
    });
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt
    );
  }

  async listAll(): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany();
    return suppliers.map(s => new Supplier(
      s.id,
      s.userId,
      s.shopName,
      s.description,
      s.status as SupplierStatus,
      s.createdAt
    ));
  }
}
