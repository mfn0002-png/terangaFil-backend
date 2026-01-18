export class AddShippingRateUseCase {
    shippingRateRepository;
    supplierRepository;
    constructor(shippingRateRepository, supplierRepository) {
        this.shippingRateRepository = shippingRateRepository;
        this.supplierRepository = supplierRepository;
    }
    async execute(data) {
        const supplier = await this.supplierRepository.findByUserId(data.userId);
        if (!supplier) {
            throw new Error('Profil fournisseur non trouvé.');
        }
        return this.shippingRateRepository.create({
            supplierId: supplier.id,
            zone: data.zone,
            price: data.price,
            delay: data.delay,
        });
    }
}
