import { ListProductsUseCase } from '../../../application/use-cases/catalog/ListProducts.js';
import { GetSupplierUseCase } from '../../../application/use-cases/catalog/GetSupplier.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
export class CatalogController {
    async listProducts(request, reply) {
        const { supplierId, category, minPrice, maxPrice } = request.query;
        const useCase = new ListProductsUseCase();
        const products = await useCase.execute({
            supplierId,
            category,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });
        return reply.send(products);
    }
    async getSupplier(request, reply) {
        const { id } = request.params;
        const repository = new PrismaSupplierRepository();
        const useCase = new GetSupplierUseCase(repository);
        try {
            const supplier = await useCase.execute(id);
            return reply.send(supplier);
        }
        catch (error) {
            return reply.status(404).send({ message: error.message });
        }
    }
}
