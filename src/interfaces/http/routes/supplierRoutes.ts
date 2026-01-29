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
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
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
        description: z.string().optional(),
        material: z.string().optional(),
        weight: z.string().optional(),
        length: z.string().optional(),
        usage: z.string().optional(),
        hookSize: z.string().optional(),
        colors: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        imageUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
    },
  }, supplierController.addProduct);

  app.get('/supplier/products', {
    schema: {
      description: 'Lister mes produits',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
    },
  }, supplierController.listMyProducts);

  app.patch('/supplier/products/:id/stock', {
    schema: {
      description: 'Mettre à jour le stock d\'un produit',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
      body: z.object({ stock: z.number().int().nonnegative() }),
    },
  }, supplierController.updateProductStock);

  app.patch('/supplier/products/:id/active', {
    schema: {
      description: 'Activer/Désactiver un produit',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
      body: z.object({ isActive: z.boolean() }),
    },
  }, supplierController.toggleProductActive);

  app.get('/supplier/products/:id', {
    schema: {
      description: 'Détails d\'un de mes produits',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
    },
  }, supplierController.getMyProduct);

  app.put('/supplier/products/:id', {
    schema: {
      description: 'Mettre à jour un produit',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
      body: z.object({
        name: z.string().optional(),
        price: z.number().optional(),
        stock: z.number().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        material: z.string().optional(),
        weight: z.string().optional(),
        length: z.string().optional(),
        usage: z.string().optional(),
        hookSize: z.string().optional(),
        colors: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        imageUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
    },
  }, supplierController.updateProduct);

  app.delete('/supplier/products/:id', {
    schema: {
      description: 'Supprimer un produit',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
    },
  }, supplierController.deleteProduct);

  app.get('/supplier/orders', {
    schema: {
      description: 'Lister mes commandes',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
    },
  }, supplierController.listMyOrders);

  app.patch('/supplier/orders/:id/status', {
    schema: {
      description: 'Mettre à jour le statut d\'une commande',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
      body: z.object({ status: z.string() }),
    },
  }, supplierController.updateOrderStatus);

  app.get('/supplier/shipping', {
    schema: {
      description: 'Lister mes tarifs de livraison',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
    },
  }, supplierController.listShippingRates);

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

  app.put('/supplier/shipping/:id', {
    schema: {
      description: 'Modifier un tarif de livraison',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
      body: z.object({
        zone: z.string(),
        price: z.number().int().nonnegative(),
        delay: z.string(),
      }),
    },
  }, supplierController.updateShippingRate);

  app.delete('/supplier/shipping/:id', {
    schema: {
      description: 'Supprimer un tarif de livraison',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.coerce.number() }),
    },
  }, supplierController.deleteShippingRate);

  app.get('/supplier/settings/payment', {
    schema: {
      description: 'Récupérer mes infos de paiement',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
    },
  }, supplierController.getPaymentSettings);

  app.patch('/supplier/settings/payment', {
    schema: {
      description: 'Mettre à jour mes infos de paiement',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        method: z.string(),
        phoneNumber: z.string(),
      }),
    },
  }, supplierController.updatePaymentSettings);

  app.patch('/supplier/branding', {
    schema: {
      description: 'Mettre à jour le branding de la boutique (logo, bannière)',
      tags: ['Fournisseur'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        shopName: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
      }),
    },
  }, supplierController.updateBranding);
}
