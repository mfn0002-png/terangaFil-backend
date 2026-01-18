export class ShippingRate {
  constructor(
    public readonly id: number,
    public readonly supplierId: number,
    public readonly zone: string,
    public readonly price: number,
    public readonly delay: string
  ) {}
}

export interface ShippingRateRepository {
  create(data: { supplierId: number; zone: string; price: number; delay: string }): Promise<ShippingRate>;
  delete(id: number): Promise<void>;
  listBySupplier(supplierId: number): Promise<ShippingRate[]>;
}
