import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SupplierController } from '../controllers/SupplierController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';

const supplierController = new SupplierController();

export async function supplierRoutes(app: FastifyInstance) {
  // Middleware global pour ce groupe de routes : Authentification requise + Rôle SUPPLIER
  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', roleMiddleware([Role.SUPPLIER]));

  app.post('/supplier/setup', {
    schema: {
      description: 'Configurer le profil de la boutique',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        shopName: z.string().min(3),
        description: z.string().optional(),
      }),
    },
  }, supplierController.setupProfile);

  app.post('/supplier/products', {
    schema: {
      description: 'Ajouter un produit au catalogue',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        name: z.string(),
        price: z.number().int().positive(),
        stock: z.number().int().nonnegative(),
        category: z.string(),
      }),
    },
  }, supplierController.addProduct);

  app.post('/supplier/shipping', {
    schema: {
      description: 'Ajouter un tarif de livraison',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        zone: z.string(),
        price: z.number().int().nonnegative(),
        delay: z.string(),
      }),
    },
  }, supplierController.addShippingRate);
}
