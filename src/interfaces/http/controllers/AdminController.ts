import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidateSupplierUseCase } from '../../../application/use-cases/admin/ValidateSupplier.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
import { SupplierStatus } from '../../../core/entities/Supplier.js';

export class AdminController {
  async validateSupplier(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: SupplierStatus };

    const repository = new PrismaSupplierRepository();
    const useCase = new ValidateSupplierUseCase(repository);

    try {
      const supplier = await useCase.execute(id, status);
      return reply.send(supplier);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async listSuppliers(request: FastifyRequest, reply: FastifyReply) {
    const repository = new PrismaSupplierRepository();
    const suppliers = await repository.listAll();
    return reply.send(suppliers);
  }
}
