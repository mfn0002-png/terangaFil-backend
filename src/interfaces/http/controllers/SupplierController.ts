import { FastifyReply, FastifyRequest } from 'fastify';
import { SetupSupplierProfileUseCase } from '../../../application/use-cases/supplier/SetupSupplierProfile.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class SupplierController {
  private getSupplier = async (userId: number) => {
    let supplier = await prisma.supplier.findUnique({ where: { userId } });
    
    if (!supplier) {
      // Fallback: check user role
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'SUPPLIER') {
        supplier = await prisma.supplier.create({
          data: {
            userId,
            shopName: `Boutique de ${user.name.split(' ')[0]}`,
            status: 'ACTIVE'
          }
        });
      } else {
        throw new Error('Fournisseur non trouvé.');
      }
    }
    return supplier;
  };

  setupProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { shopName, description } = request.body as any;

    const repository = new PrismaSupplierRepository();
    const useCase = new SetupSupplierProfileUseCase(repository);

    try {
      const supplier = await useCase.execute({ userId, shopName, description });
      return reply.status(201).send(supplier);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  addProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { name, price, stock, category, description, material, weight, length, usage, hookSize, colors, sizes, imageUrl, images } = request.body as any;

    try {
      const supplier = await this.getSupplier(userId);
      const product = await prisma.product.create({
        data: {
          supplierId: supplier.id,
          name, price, stock, category,
          description, material, weight, length, usage, hookSize,
          colors, sizes, imageUrl, images
        }
      });
      return reply.status(201).send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getMyProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const product = await prisma.product.findFirst({
        where: { id, supplierId: supplier.id }
      });
      if (!product) return reply.status(404).send({ message: 'Produit non trouvé.' });
      return reply.send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  updateProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const data = request.body as any;

    try {
      const supplier = await this.getSupplier(userId);
      // Clean data
      const { id: _, supplierId: __, createdAt: ___, updatedAt: ____, ...updateData } = data;
      
      const product = await prisma.product.update({
        where: { id, supplierId: supplier.id },
        data: updateData
      });
      return reply.send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  listMyProducts = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    try {
      const supplier = await this.getSupplier(userId);
      const products = await prisma.product.findMany({
        where: { supplierId: supplier.id },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send(products);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  updateProductStock = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { stock } = request.body as { stock: number };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const product = await prisma.product.updateMany({
        where: { id, supplierId: supplier.id },
        data: { stock }
      });
      return reply.send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  toggleProductActive = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { isActive } = request.body as { isActive: boolean };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const product = await prisma.product.updateMany({
        where: { id, supplierId: supplier.id },
        data: { isActive }
      });
      return reply.send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  deleteProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      await prisma.product.deleteMany({
        where: { id, supplierId: supplier.id }
      });
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  listMyOrders = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    try {
      const supplier = await this.getSupplier(userId);
      const orders = await prisma.supplierOrder.findMany({
        where: { supplierId: supplier.id },
        include: { 
          order: { 
            include: { 
              user: true,
              items: {
                where: { product: { supplierId: supplier.id } },
                include: { product: true }
              }
            } 
          } 
        },
        orderBy: { order: { createdAt: 'desc' } }
      });
      return reply.send(orders);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  updateOrderStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { status } = request.body as { status: any };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const order = await prisma.supplierOrder.updateMany({
        where: { id, supplierId: supplier.id },
        data: { status }
      });
      return reply.send(order);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getStats = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const orders = await prisma.supplierOrder.findMany({
        where: { supplierId: supplier.id },
        include: { order: true }
      });

      const totalRevenue = orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.order.total, 0);

      const lowStockItems = await prisma.product.count({
        where: { supplierId: supplier.id, stock: { lt: 10 } }
      });

      return reply.send({
        overview: {
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length,
          totalRevenue,
          lowStockItems
        }
      });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  listShippingRates = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    try {
      const supplier = await this.getSupplier(userId);
      const rates = await prisma.shippingRate.findMany({
        where: { supplierId: supplier.id }
      });
      return reply.send(rates);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  addShippingRate = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { zone, price, delay } = request.body as any;

    try {
      const supplier = await this.getSupplier(userId);
      const rate = await prisma.shippingRate.create({
        data: { supplierId: supplier.id, zone, price, delay }
      });
      return reply.status(201).send(rate);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  updateShippingRate = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { zone, price, delay } = request.body as any;
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const rate = await prisma.shippingRate.updateMany({
        where: { id, supplierId: supplier.id },
        data: { zone, price, delay }
      });
      return reply.send(rate);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  deleteShippingRate = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      await prisma.shippingRate.deleteMany({
        where: { id, supplierId: supplier.id }
      });
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  getPaymentSettings = async (request: FastifyRequest, reply: FastifyReply) => {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    try {
      const supplier = await this.getSupplier(userId);
      return reply.send({ 
        paymentMethod: supplier.paymentMethod, 
        paymentPhoneNumber: supplier.paymentPhoneNumber 
      });
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };

  updatePaymentSettings = async (request: FastifyRequest, reply: FastifyReply) => {
    const { method, phoneNumber } = request.body as any;
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const supplier = await this.getSupplier(userId);
      const updated = await prisma.supplier.update({
        where: { id: supplier.id },
        data: { 
          paymentMethod: method, 
          paymentPhoneNumber: phoneNumber 
        }
      });
      return reply.send(updated);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  };
}
