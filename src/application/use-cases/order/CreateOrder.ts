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

  async execute(data: { 
    userId: number; 
    items: { 
      productId: number; 
      quantity: number; 
      color?: string; 
      size?: string; 
      shippingZone?: string 
    }[]; 
    customerInfo?: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      address: string;
    };
  }) {
    // 1. Récupérer les produits et vérifier le stock
    const itemsWithDetails = await Promise.all(
      data.items.map(async (item) => {
        const product = await (prisma as any).product.findUnique({ 
          where: { id: item.productId },
          include: { supplier: { include: { shipping: true } } }
        });
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
      
      // Calculer les frais de port : somme des frais pour chaque zone unique choisie pour ce fournisseur
      const uniqueZones = new Set();
      items.forEach((item: any) => {
        if (item.shippingZone) {
          const rate = item.product.supplier.shipping.find(
            (r: any) => r.zone.toLowerCase() === item.shippingZone.toLowerCase()
          );
          uniqueZones.add(`${item.shippingZone}_${rate ? rate.price : 0}`);
        }
      });

      let supplierShippingPrice = 0;
      uniqueZones.forEach((zoneKey: any) => {
        const [_, price] = zoneKey.split('_');
        supplierShippingPrice += Number(price);
      });
      
      totalProducts += subtotal;
      totalShipping += supplierShippingPrice;
      
      supplierInfos.push({
        supplierId,
        shippingPrice: supplierShippingPrice,
        items
      });
    }

    const grandTotal = totalProducts + totalShipping;

    // 4. Création transactionnelle
    return await prisma.$transaction(async (tx) => {
      // Créer la commande globale
      const order = await tx.order.create({
        data: {
          userId: data.userId,
          total: grandTotal,
          status: 'PENDING',
          customerFirstName: data.customerInfo?.firstName || null,
          customerLastName: data.customerInfo?.lastName || null,
          customerPhoneNumber: data.customerInfo?.phoneNumber || null,
          customerAddress: data.customerInfo?.address || null,
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
              color: item.color || null,
              size: item.size || null,
              shippingZone: item.shippingZone || null,
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
