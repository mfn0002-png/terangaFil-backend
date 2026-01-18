import { prisma } from '../../../infrastructure/database/prisma.js';
export class SetupSupplierProfileUseCase {
    supplierRepository;
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    async execute(data) {
        const existingSupplier = await this.supplierRepository.findByUserId(data.userId);
        if (existingSupplier) {
            throw new Error('Un profil fournisseur existe déjà pour cet utilisateur.');
        }
        const supplier = await this.supplierRepository.create(data);
        // Assigner le plan FREE par défaut
        const freePlan = await prisma.plan.findUnique({ where: { name: 'FREE' } });
        if (freePlan) {
            await prisma.subscription.create({
                data: {
                    supplierId: supplier.id,
                    planId: freePlan.id,
                    status: 'ACTIVE',
                }
            });
        }
        return supplier;
    }
}
