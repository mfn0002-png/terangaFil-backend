export enum SupplierStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export class Supplier {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly shopName: string,
    public readonly description: string | null,
    public readonly status: SupplierStatus,
    public readonly createdAt: Date
  ) {}
}
