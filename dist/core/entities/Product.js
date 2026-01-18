export class Product {
    id;
    supplierId;
    name;
    price;
    stock;
    category;
    createdAt;
    constructor(id, supplierId, name, price, stock, category, createdAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.createdAt = createdAt;
    }
}
