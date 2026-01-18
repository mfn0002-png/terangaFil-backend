export class ValidateSupplierUseCase {
    supplierRepository;
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    async execute(id, status) {
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier) {
            throw new Error('Fournisseur non trouvé.');
        }
        return this.supplierRepository.updateStatus(id, status);
    }
}
