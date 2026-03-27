import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CatalogController } from '../controllers/CatalogController.js';
import { ReviewController } from '../controllers/ReviewController.js';

const catalogController = new CatalogController();
const reviewController = new ReviewController();

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
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
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

  app.get('/catalog/products/:id/reviews', {
    schema: {
      description: 'Récupérer les avis d\'un produit',
      tags: ['Catalogue'],
      params: z.object({ id: z.string() }),
    },
  }, reviewController.getProductReviews);
}
