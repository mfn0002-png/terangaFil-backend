import { OrderRepository } from '../../../core/repositories/OrderRepository.js';
import { ProductRepository } from '../../../core/repositories/ProductRepository.js';
import { ShippingRateRepository } from '../../../core/repositories/ShippingRateRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
    private shippingRateRepository: ShippingRateRepository
  ) {}

  async execute(data: { userId: number; items: { productId: number; quantity: number }[]; shippingZone: string }) {
    // 1. Récupérer les produits et vérifier le stock
    const itemsWithDetails = await Promise.all(
      data.items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);
        if (!product) throw new Error(`Produit ${item.productId} non trouvé.`);
        if (product.stock < item.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
        return { ...item, product };
      })
    );

    // 2. Grouper par fournisseur
    const supplierGroups = itemsWithDetails.reduce((groups: any, item) => {
      const sId = item.product.supplierId;
      if (!groups[sId]) groups[sId] = [];
      groups[sId].push(item);
      return groups;
    }, {});

    // 3. Calculer les totaux et frais de port par groupe
    let totalProducts = 0;
    let totalShipping = 0;
    const supplierInfos: { supplierId: number, shippingPrice: number, items: any[] }[] = [];

    for (const supplierIdStr in supplierGroups) {
      const supplierId = Number(supplierIdStr);
      const items = supplierGroups[supplierIdStr];
      const subtotal = items.reduce((sum: number, i: any) => sum + (i.product.price * i.quantity), 0);
      
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
