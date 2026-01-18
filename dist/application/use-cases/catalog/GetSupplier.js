export class GetSupplierUseCase {
    supplierRepository;
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    async execute(id) {
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier) {
            throw new Error('Fournisseur non trouvé.');
        }
        if (supplier.status !== 'ACTIVE') {
            throw new Error('Ce fournisseur n\'est pas encore validé.');
        }
        return {
            shopName: supplier.shopName,
            description: supplier.description,
            createdAt: supplier.createdAt
        };
    }
}
