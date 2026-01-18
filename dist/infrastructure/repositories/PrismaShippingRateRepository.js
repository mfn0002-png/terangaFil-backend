import { prisma } from '../database/prisma.js';
import { ShippingRate } from '../../core/repositories/ShippingRateRepository.js';
export class PrismaShippingRateRepository {
    async create(data) {
        const rate = await prisma.shippingRate.create({
            data,
        });
        return new ShippingRate(rate.id, rate.supplierId, rate.zone, rate.price, rate.delay);
    }
    async delete(id) {
        await prisma.shippingRate.delete({ where: { id } });
    }
    async listBySupplier(supplierId) {
        const rates = await prisma.shippingRate.findMany({ where: { supplierId } });
        return rates.map(r => new ShippingRate(r.id, r.supplierId, r.zone, r.price, r.delay));
    }
}
