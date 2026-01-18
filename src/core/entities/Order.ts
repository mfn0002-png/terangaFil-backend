export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export class Order {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly total: number,
    public readonly status: OrderStatus,
    public readonly createdAt: Date
  ) {}
}
