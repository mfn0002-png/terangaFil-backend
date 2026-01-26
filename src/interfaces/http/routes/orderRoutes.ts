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
        items: z.array(z.object({
          productId: z.union([z.number(), z.string()]).pipe(z.coerce.number().int().positive()),
          quantity: z.number().int().positive(),
          color: z.string().optional().nullable(),
          size: z.string().optional().nullable(),
          shippingZone: z.string().optional().nullable(),
        })).min(1),
        paymentMethod: z.string(),
        customerInfo: z.object({
          firstName: z.string(),
          lastName: z.string(),
          phoneNumber: z.string(),
          address: z.string(),
        }),
      }),
    },
    preHandler: [authMiddleware],
  }, orderController.create);
}
