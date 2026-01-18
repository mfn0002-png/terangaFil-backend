import { FastifyReply, FastifyRequest } from 'fastify';
import { SetupSupplierProfileUseCase } from '../../../application/use-cases/supplier/SetupSupplierProfile.js';
import { AddProductUseCase } from '../../../application/use-cases/supplier/AddProduct.js';
import { AddShippingRateUseCase } from '../../../application/use-cases/supplier/AddShippingRate.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaShippingRateRepository } from '../../../infrastructure/repositories/PrismaShippingRateRepository.js';

export class SupplierController {
  async setupProfile(request: FastifyRequest, reply: FastifyReply) {
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
  }

  async addProduct(request: FastifyRequest, reply: FastifyReply) {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { name, price, stock, category } = request.body as any;

    const productRepo = new PrismaProductRepository();
    const supplierRepo = new PrismaSupplierRepository();
    const useCase = new AddProductUseCase(productRepo, supplierRepo);

    try {
      const product = await useCase.execute({ userId, name, price, stock, category });
      return reply.status(201).send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async addShippingRate(request: FastifyRequest, reply: FastifyReply) {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { zone, price, delay } = request.body as any;

    const shippingRepo = new PrismaShippingRateRepository();
    const supplierRepo = new PrismaSupplierRepository();
    const useCase = new AddShippingRateUseCase(shippingRepo as any, supplierRepo);

    try {
      const rate = await useCase.execute({ userId, zone, price, delay });
      return reply.status(201).send(rate);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
