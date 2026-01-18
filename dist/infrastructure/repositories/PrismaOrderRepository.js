import { prisma } from '../database/prisma.js';
import { Order } from '../../core/entities/Order.js';
export class PrismaOrderRepository {
    async create(data) {
        // La création complexe est gérée par le Use Case via transaction
        // Cette méthode reste pour la compatibilité interface ou cas simples
        const order = await prisma.order.create({
            data: {
                userId: data.userId,
                total: data.total,
                status: 'PENDING',
            }
        });
        return new Order(order.id, order.userId, order.total, order.status, order.createdAt);
    }
    async findById(id) {
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order)
            return null;
        return new Order(order.id, order.userId, order.total, order.status, order.createdAt);
    }
    async listByUser(userId) {
        const orders = await prisma.order.findMany({ where: { userId } });
        return orders.map(o => new Order(o.id, o.userId, o.total, o.status, o.createdAt));
    }
    async updateStatus(id, status) {
        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });
        return new Order(order.id, order.userId, order.total, order.status, order.createdAt);
    }
}
