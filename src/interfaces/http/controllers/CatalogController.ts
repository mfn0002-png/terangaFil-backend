import { FastifyReply, FastifyRequest } from 'fastify';
import { ListProductsUseCase } from '../../../application/use-cases/catalog/ListProducts.js';
import { GetSupplierUseCase } from '../../../application/use-cases/catalog/GetSupplier.js';
import { ListSuppliersUseCase } from '../../../application/use-cases/catalog/ListSuppliers.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';

export class CatalogController {
  async listProducts(request: FastifyRequest, reply: FastifyReply) {
    const { supplierId, category, minPrice, maxPrice } = request.query as any;

    const useCase = new ListProductsUseCase();

    const products = await useCase.execute({
      supplierId: supplierId ? Number(supplierId) : undefined,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    return reply.send(products);
  }

  async getSupplier(request: FastifyRequest, reply: FastifyReply) {
    const { id: idStr } = request.params as { id: string };
    const id = Number(idStr);

    const repository = new PrismaSupplierRepository();
    const useCase = new GetSupplierUseCase(repository);

    try {
      const supplier = await useCase.execute(id);
      return reply.send(supplier);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async listSuppliers(request: FastifyRequest, reply: FastifyReply) {
    const repository = new PrismaSupplierRepository();
    const useCase = new ListSuppliersUseCase(repository);
    const suppliers = await useCase.execute();
    return reply.send(suppliers);
  }

  async getProduct(request: FastifyRequest, reply: FastifyReply) {
    const { id: idStr } = request.params as { id: string };
    const id = Number(idStr);

    const repository = new PrismaProductRepository();

    try {
      const product = await repository.findById(id);
      if (!product) {
        return reply.status(404).send({ message: 'Produit non trouvé.' });
      }
      return reply.send(product);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }
}
