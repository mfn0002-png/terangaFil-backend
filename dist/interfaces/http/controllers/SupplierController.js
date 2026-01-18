import { SetupSupplierProfileUseCase } from '../../../application/use-cases/supplier/SetupSupplierProfile.js';
import { AddProductUseCase } from '../../../application/use-cases/supplier/AddProduct.js';
import { AddShippingRateUseCase } from '../../../application/use-cases/supplier/AddShippingRate.js';
import { PrismaSupplierRepository } from '../../../infrastructure/repositories/PrismaSupplierRepository.js';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository.js';
import { PrismaShippingRateRepository } from '../../../infrastructure/repositories/PrismaShippingRateRepository.js';
export class SupplierController {
    async setupProfile(request, reply) {
        const { sub: userId } = request.user;
        const { shopName, description } = request.body;
        const repository = new PrismaSupplierRepository();
        const useCase = new SetupSupplierProfileUseCase(repository);
        try {
            const supplier = await useCase.execute({ userId, shopName, description });
            return reply.status(201).send(supplier);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async addProduct(request, reply) {
        const { sub: userId } = request.user;
        const { name, price, stock, category } = request.body;
        const productRepo = new PrismaProductRepository();
        const supplierRepo = new PrismaSupplierRepository();
        const useCase = new AddProductUseCase(productRepo, supplierRepo);
        try {
            const product = await useCase.execute({ userId, name, price, stock, category });
            return reply.status(201).send(product);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async addShippingRate(request, reply) {
        const { sub: userId } = request.user;
        const { zone, price, delay } = request.body;
        const shippingRepo = new PrismaShippingRateRepository();
        const supplierRepo = new PrismaSupplierRepository();
        const useCase = new AddShippingRateUseCase(shippingRepo, supplierRepo);
        try {
            const rate = await useCase.execute({ userId, zone, price, delay });
            return reply.status(201).send(rate);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
