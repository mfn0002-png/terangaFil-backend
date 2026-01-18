export class ShippingRate {
    id;
    supplierId;
    zone;
    price;
    delay;
    constructor(id, supplierId, zone, price, delay) {
        this.id = id;
        this.supplierId = supplierId;
        this.zone = zone;
        this.price = price;
        this.delay = delay;
    }
}
