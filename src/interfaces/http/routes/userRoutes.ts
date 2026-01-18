import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserController } from '../controllers/UserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const userController = new UserController();

export async function userRoutes(app: FastifyInstance) {
  app.post('/users', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.string().email().optional().nullable(),
        phoneNumber: z.string(),
        password: z.string(),
        role: z.enum(['CLIENT', 'SUPPLIER', 'ADMIN']),
      }),
    },
  }, userController.create);

  app.get('/users/me', {
    schema: {
      description: 'Récupérer profil utilisateur',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [authMiddleware],
  }, userController.getMe);

  app.put('/users/me', {
    schema: {
      description: 'Mettre à jour profil utilisateur',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phoneNumber: z.string().optional(),
      }),
    },
    preHandler: [authMiddleware],
  }, userController.updateMe);
}
