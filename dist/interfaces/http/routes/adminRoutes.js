import { z } from 'zod';
import { AdminController } from '../controllers/AdminController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { SupplierStatus } from '../../../core/entities/Supplier.js';
import { Role } from '@prisma/client';
const adminController = new AdminController();
export async function adminRoutes(app) {
    app.addHook('preHandler', authMiddleware);
    app.addHook('preHandler', roleMiddleware([Role.ADMIN]));
    app.get('/admin/suppliers', {
        schema: {
            description: 'Lister tous les fournisseurs (pour validation)',
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
        },
    }, adminController.listSuppliers);
    app.patch('/admin/suppliers/:id/status', {
        schema: {
            description: 'Changer le statut d\'un fournisseur',
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: z.object({
                id: z.string().uuid(),
            }),
            body: z.object({
                status: z.nativeEnum(SupplierStatus),
            }),
        },
    }, adminController.validateSupplier);
}
