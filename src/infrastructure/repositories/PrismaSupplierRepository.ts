import { prisma } from '../database/prisma.js';
import { Supplier, SupplierStatus } from '../../core/entities/Supplier.js';
import { SupplierRepository } from '../../core/repositories/SupplierRepository.js';

export class PrismaSupplierRepository implements SupplierRepository {
  async create(data: { userId: number; shopName: string; description?: string; logoUrl?: string; bannerUrl?: string }): Promise<Supplier> {
    const supplier = await prisma.supplier.create({
      data: {
        userId: data.userId,
        shopName: data.shopName,
        description: data.description,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        status: 'PENDING',
      },
    });
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt,
      supplier.logoUrl,
      supplier.bannerUrl
    );
  }

  async findById(id: number): Promise<Supplier | null> {
    const supplier = await (prisma as any).supplier.findUnique({ 
      where: { id },
      include: { shipping: true }
    });
    if (!supplier) return null;
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt,
      supplier.logoUrl,
      supplier.bannerUrl,
      supplier.shipping
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
      supplier.createdAt,
      supplier.logoUrl,
      supplier.bannerUrl
    );
  }

  async updateStatus(id: number, status: SupplierStatus): Promise<Supplier> {
    const supplier = await (prisma as any).supplier.update({
      where: { id },
      data: { status },
      include: { shipping: true }
    });
    return new Supplier(
      supplier.id,
      supplier.userId,
      supplier.shopName,
      supplier.description,
      supplier.status as SupplierStatus,
      supplier.createdAt,
      supplier.logoUrl,
      supplier.bannerUrl,
      supplier.shipping
    );
  }

  async listAll(): Promise<Supplier[]> {
    const suppliers = await (prisma as any).supplier.findMany({
      include: { shipping: true }
    });
    return suppliers.map((s: any) => new Supplier(
      s.id,
      s.userId,
      s.shopName,
      s.description,
      s.status as SupplierStatus,
      s.createdAt,
      s.logoUrl,
      s.bannerUrl,
      s.shipping
    ));
  }
}
