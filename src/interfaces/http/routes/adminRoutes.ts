import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AdminController } from '../controllers/AdminController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { SupplierStatus } from '../../../core/entities/Supplier.js';
import { Role } from '@prisma/client';

const adminController = new AdminController();

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', roleMiddleware([Role.ADMIN]));

  app.get('/admin/suppliers', {
    schema: {
      description: 'Lister tous les fournisseurs avec performances',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, adminController.listSuppliers);

  app.post('/admin/suppliers/invite', {
    schema: {
      description: 'Inviter un nouveau fournisseur par email',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        email: z.string().email(),
        name: z.string(),
        shopName: z.string(),
        phoneNumber: z.string(),
        status: z.nativeEnum(SupplierStatus).optional(),
      }),
    },
  }, adminController.inviteSupplier);

  app.get('/admin/suppliers/:id', {
    schema: {
      description: 'Obtenir les détails complets d\'un fournisseur',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, adminController.getSupplierDetails);

  app.get('/admin/products', {
    schema: {
      description: 'Lister tous les produits du catalogue global',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, adminController.listAllProducts);

  app.patch('/admin/products/:id/visibility', {
    schema: {
      description: 'Modérer la visibilité d\'un produit',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: z.object({ isActive: z.boolean() }),
    },
  }, adminController.toggleProductVisibility);

  app.get('/admin/stats', {
    schema: {
      description: 'Obtenir les statistiques globales du dashboard admin',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, adminController.getStats);

  app.get('/admin/commissions', {
    schema: {
      description: 'Obtenir l\'historique des commissions et reversements',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, adminController.getCommissionHistory);

  app.patch('/admin/payouts/:id/retry', {
    schema: {
      description: 'Relancer manuellement un versement échoué',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, adminController.retryPayout);

  app.patch('/admin/suppliers/:id/status', {
    schema: {
      description: 'Changer le statut d\'un fournisseur',
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string(), // On accepte le string qui sera converti en number
      }),
      body: z.object({
        status: z.nativeEnum(SupplierStatus),
      }),
    },
  }, adminController.validateSupplier);
}
