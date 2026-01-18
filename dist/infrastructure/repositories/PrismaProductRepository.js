import { prisma } from '../database/prisma.js';
import { Product } from '../../core/entities/Product.js';
export class PrismaProductRepository {
    async create(data) {
        const product = await prisma.product.create({
            data,
        });
        return new Product(product.id, product.supplierId, product.name, product.price, product.stock, product.category, product.createdAt);
    }
    async findById(id) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product)
            return null;
        return new Product(product.id, product.supplierId, product.name, product.price, product.stock, product.category, product.createdAt);
    }
    async listBySupplier(supplierId) {
        const products = await prisma.product.findMany({ where: { supplierId } });
        return products.map(p => new Product(p.id, p.supplierId, p.name, p.price, p.stock, p.category, p.createdAt));
    }
    async listAll() {
        const products = await prisma.product.findMany();
        return products.map(p => new Product(p.id, p.supplierId, p.name, p.price, p.stock, p.category, p.createdAt));
    }
    async updateStock(id, quantity) {
        const product = await prisma.product.update({
            where: { id },
            data: { stock: quantity }
        });
        return new Product(product.id, product.supplierId, product.name, product.price, product.stock, product.category, product.createdAt);
    }
}
