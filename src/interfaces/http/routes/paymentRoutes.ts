import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/PaymentController.js';
import { z } from 'zod';

const initiatePaymentSchema = z.object({
  orderId: z.number(),
  amount: z.number(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string(),
});

export async function paymentRoutes(app: FastifyInstance) {
  const paymentController = new PaymentController();

  // Initialiser un paiement
  app.post(
    '/payment/initiate',
    {
      schema: {
        description: 'Initialise un paiement via PayDunya',
        tags: ['Payment'],
        body: initiatePaymentSchema,
      },
    },
    async (request, reply) => {
      return paymentController.initiatePayment(request as any, reply);
    }
  );

  // Vérifier le statut d'un paiement
  app.get(
    '/payment/verify/:token',
    {
      schema: {
        description: 'Vérifie le statut d\'un paiement',
        tags: ['Payment'],
        params: z.object({
          token: z.string(),
        }),
      },
    },
    async (request, reply) => {
      return paymentController.verifyPayment(request as any, reply);
    }
  );

  // Webhook callback de PayDunya
  app.post(
    '/payment/callback',
    {
      schema: {
        description: 'Callback webhook de PayDunya',
        tags: ['Payment'],
      },
    },
    async (request, reply) => {
      return paymentController.handleCallback(request as any, reply);
    }
  );
}
