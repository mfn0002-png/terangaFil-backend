import { ValidateSupplierUseCase } from '../../../application/use-cases/admin/ValidateSupplier.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
export class AdminController {
    async validateSupplier(request, reply) {
        const { id } = request.params;
        const { status } = request.body;
        const repository = new PrismaSupplierRepository();
        const useCase = new ValidateSupplierUseCase(repository);
        try {
            const supplier = await useCase.execute(id, status);
            return reply.send(supplier);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async listSuppliers(request, reply) {
        const repository = new PrismaSupplierRepository();
        const suppliers = await repository.listAll();
        return reply.send(suppliers);
    }
}
