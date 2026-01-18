import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CatalogController } from '../controllers/CatalogController.js';

const catalogController = new CatalogController();

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/catalog/products', {
    schema: {
      description: 'Lister les produits avec filtres',
      tags: ['Catalogue'],
      querystring: z.object({
        supplierId: z.string().optional(),
        category: z.string().optional(),
        minPrice: z.coerce.number().int().optional(),
        maxPrice: z.coerce.number().int().optional(),
      }),
    },
  }, catalogController.listProducts);

  app.get('/catalog/suppliers', {
    schema: {
      description: 'Lister les fournisseurs actifs',
      tags: ['Catalogue'],
    },
  }, catalogController.listSuppliers);

  app.get('/catalog/suppliers/:id', {
    schema: {
      description: 'Récupérer les informations publiques d\'un fournisseur',
      tags: ['Catalogue'],
      params: z.object({
        id: z.string(),
      }),
    },
  }, catalogController.getSupplier);

  app.get('/catalog/products/:id', {
    schema: {
      description: 'Récupérer les détails d\'un produit',
      tags: ['Catalogue'],
      params: z.object({
        id: z.string(),
      }),
    },
  }, catalogController.getProduct);
}
