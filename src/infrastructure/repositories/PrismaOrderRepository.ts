import { prisma } from '../database/prisma.js';
import { Order, OrderStatus } from '../../core/entities/Order.js';
import { OrderRepository } from '../../core/repositories/OrderRepository.js';

export class PrismaOrderRepository implements OrderRepository {
  async create(data: { userId: number; total: number; items: any[] }): Promise<Order> {
    // La création complexe est gérée par le Use Case via transaction
    // Cette méthode reste pour la compatibilité interface ou cas simples
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        status: 'PENDING',
      }
    });
    return new Order(order.id, order.userId, order.total, order.status as OrderStatus, order.createdAt);
  }

  async findById(id: number): Promise<Order | null> {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return null;
    return new Order(order.id, order.userId, order.total, order.status as OrderStatus, order.createdAt);
  }

  async listByUser(userId: number): Promise<Order[]> {
    const orders = await prisma.order.findMany({ where: { userId } });
    return orders.map(o => new Order(o.id, o.userId, o.total, o.status as OrderStatus, o.createdAt));
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });
    return new Order(order.id, order.userId, order.total, order.status as OrderStatus, order.createdAt);
  }
}
