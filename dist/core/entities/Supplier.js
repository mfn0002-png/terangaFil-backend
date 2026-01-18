export var SupplierStatus;
(function (SupplierStatus) {
    SupplierStatus["PENDING"] = "PENDING";
    SupplierStatus["ACTIVE"] = "ACTIVE";
    SupplierStatus["SUSPENDED"] = "SUSPENDED";
})(SupplierStatus || (SupplierStatus = {}));
export class Supplier {
    id;
    userId;
    shopName;
    description;
    status;
    createdAt;
    constructor(id, userId, shopName, description, status, createdAt) {
        this.id = id;
        this.userId = userId;
        this.shopName = shopName;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }
}
