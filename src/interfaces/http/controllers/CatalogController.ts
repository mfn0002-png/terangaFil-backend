import { FastifyReply, FastifyRequest } from 'fastify';
import { ListProductsUseCase } from '../../../application/use-cases/catalog/ListProducts.js';
import { GetSupplierUseCase } from '../../../application/use-cases/catalog/GetSupplier.js';
import { ListSuppliersUseCase } from '../../../application/use-cases/catalog/ListSuppliers.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';

export class CatalogController {
  async listProducts(request: FastifyRequest, reply: FastifyReply) {
    const { supplierId, category, minPrice, maxPrice, page: pageStr, limit: limitStr } = request.query as any;

    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 12;

    const useCase = new ListProductsUseCase();

    const result = await useCase.execute({
      supplierId: supplierId ? Number(supplierId) : undefined,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page,
      limit
    });

    return reply.send({
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
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
    const { page: pageStr, limit: limitStr } = request.query as any;
    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 12;
    const skip = (page - 1) * limit;

    const repository = new PrismaSupplierRepository();
    const useCase = new ListSuppliersUseCase(repository);
    const allSuppliers = await useCase.execute();
    
    // Manual pagination for now as the usecase returns all ACTIVE suppliers
    const total = allSuppliers.length;
    const paginatedSuppliers = allSuppliers.slice(skip, skip + limit);

    return reply.send({
      data: paginatedSuppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
