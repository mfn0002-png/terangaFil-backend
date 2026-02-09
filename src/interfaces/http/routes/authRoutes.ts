import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthController } from '../controllers/AuthController.js';
import { Role } from '@prisma/client';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', {
    schema: {
      description: 'Inscription d\'un nouvel utilisateur',
      tags: ['Authentification'],
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phoneNumber: z.string().min(8), // Format simple pour l'instant
        password: z.string().min(6),
        role: z.nativeEnum(Role),
      }),
    },
  }, authController.register);

  app.post('/auth/login', {
    schema: {
      description: 'Connexion (Email ou Téléphone)',
      tags: ['Authentification'],
      body: z.object({
        identifier: z.string().describe('Email ou numéro de téléphone'),
        password: z.string(),
      }),
    },
  }, authController.login);

  app.post('/auth/setup-password', {
    schema: {
      description: 'Configurer le mot de passe pour un compte invité',
      tags: ['Authentification'],
      body: z.object({
        token: z.string(),
        password: z.string().min(6),
      }),
    },
  }, authController.setupPassword);
}
