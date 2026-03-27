import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReviewController } from '../controllers/ReviewController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';

const reviewController = new ReviewController();

export async function reviewRoutes(app: FastifyInstance) {
  // Route publique — récupérer les avis d'un produit (enregistrée dans catalogRoutes)
  // Route protégée — soumettre un avis
  app.post('/reviews', {
    preHandler: [authMiddleware, roleMiddleware([Role.CLIENT])],
    schema: {
      description: 'Soumettre un avis sur un produit acheté',
      tags: ['Avis'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        productId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
    },
  }, reviewController.submitReview);
}
