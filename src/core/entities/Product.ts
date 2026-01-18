export class Product {
  constructor(
    public readonly id: number,
    public readonly supplierId: number,
    public readonly name: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly category: string,
    public readonly createdAt: Date
  ) {}
}
