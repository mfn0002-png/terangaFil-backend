import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OrderController } from '../controllers/OrderController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';

const orderController = new OrderController();

export async function orderRoutes(app: FastifyInstance) {
  app.post('/orders', {
    schema: {
      description: 'Passer une nouvelle commande multi-vendeurs',
      tags: ['Commandes'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        shippingZone: z.string(),
        items: z.array(z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })).min(1),
      }),
    },
    preHandler: [authMiddleware],
  }, orderController.create);
}
