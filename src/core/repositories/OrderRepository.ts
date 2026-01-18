import { Order, OrderStatus } from '../entities/Order.js';

export interface OrderRepository {
  create(data: { userId: number; total: number; items: any[] }): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  listByUser(userId: number): Promise<Order[]>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
}
