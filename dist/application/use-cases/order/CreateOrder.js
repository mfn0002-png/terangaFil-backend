import { prisma } from '../../../infrastructure/database/prisma.js';
export class CreateOrderUseCase {
    orderRepository;
    productRepository;
    shippingRateRepository;
    constructor(orderRepository, productRepository, shippingRateRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.shippingRateRepository = shippingRateRepository;
    }
    async execute(data) {
        // 1. Récupérer les produits et vérifier le stock
        const itemsWithDetails = await Promise.all(data.items.map(async (item) => {
            const product = await this.productRepository.findById(item.productId);
            if (!product)
                throw new Error(`Produit ${item.productId} non trouvé.`);
            if (product.stock < item.quantity)
                throw new Error(`Stock insuffisant pour ${product.name}.`);
            return { ...item, product };
        }));
        // 2. Grouper par fournisseur
        const supplierGroups = itemsWithDetails.reduce((groups, item) => {
            const sId = item.product.supplierId;
            if (!groups[sId])
                groups[sId] = [];
            groups[sId].push(item);
            return groups;
        }, {});
        // 3. Calculer les totaux et frais de port par groupe
        let totalProducts = 0;
        let totalShipping = 0;
        const supplierInfos = [];
        for (const supplierId in supplierGroups) {
            const items = supplierGroups[supplierId];
            const subtotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
            // Trouver le tarif de livraison pour ce fournisseur et cette zone
            const rates = await this.shippingRateRepository.listBySupplier(supplierId);
            const rate = rates.find(r => r.zone.toLowerCase() === data.shippingZone.toLowerCase());
            const shippingPrice = rate ? rate.price : 0; // Si pas de zone trouvée, on pourrait lever une erreur ou mettre 0
            totalProducts += subtotal;
            totalShipping += shippingPrice;
            supplierInfos.push({
                supplierId,
                shippingPrice,
                items
            });
        }
        const grandTotal = totalProducts + totalShipping;
        // 4. Création transactionnelle (via Prisma directement pour assurer l'atomicité car SOLID Repository peut être limité ici)
        return await prisma.$transaction(async (tx) => {
            // Créer la commande globale
            const order = await tx.order.create({
                data: {
                    userId: data.userId,
                    total: grandTotal,
                    status: 'PENDING',
                },
            });
            // Créer les SupplierOrders
            for (const info of supplierInfos) {
                await tx.supplierOrder.create({
                    data: {
                        orderId: order.id,
                        supplierId: info.supplierId,
                        shippingPrice: info.shippingPrice,
                        status: 'PENDING',
                    }
                });
                // Créer les OrderItems et mettre à jour le stock
                for (const item of info.items) {
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        }
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
            return order;
        });
    }
}
