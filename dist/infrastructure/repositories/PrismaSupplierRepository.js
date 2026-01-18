import { prisma } from '../database/prisma.js';
import { Supplier } from '../../core/entities/Supplier.js';
export class PrismaSupplierRepository {
    async create(data) {
        const supplier = await prisma.supplier.create({
            data: {
                userId: data.userId,
                shopName: data.shopName,
                description: data.description,
                status: 'PENDING',
            },
        });
        return new Supplier(supplier.id, supplier.userId, supplier.shopName, supplier.description, supplier.status, supplier.createdAt);
    }
    async findById(id) {
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier)
            return null;
        return new Supplier(supplier.id, supplier.userId, supplier.shopName, supplier.description, supplier.status, supplier.createdAt);
    }
    async findByUserId(userId) {
        const supplier = await prisma.supplier.findUnique({ where: { userId } });
        if (!supplier)
            return null;
        return new Supplier(supplier.id, supplier.userId, supplier.shopName, supplier.description, supplier.status, supplier.createdAt);
    }
    async updateStatus(id, status) {
        const supplier = await prisma.supplier.update({
            where: { id },
            data: { status },
        });
        return new Supplier(supplier.id, supplier.userId, supplier.shopName, supplier.description, supplier.status, supplier.createdAt);
    }
    async listAll() {
        const suppliers = await prisma.supplier.findMany();
        return suppliers.map(s => new Supplier(s.id, s.userId, s.shopName, s.description, s.status, s.createdAt));
    }
}
