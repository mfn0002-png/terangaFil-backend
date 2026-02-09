import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotificationController } from '../controllers/NotificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const notificationController = new NotificationController();

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/notifications', {
    schema: {
      description: 'Lister mes notifications',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, notificationController.listMyNotifications);

  app.patch('/notifications/:id/read', {
    schema: {
      description: 'Marquer une notification comme lue',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string(),
      }),
    },
  }, notificationController.markAsRead);

  app.post('/notifications/read-all', {
    schema: {
      description: 'Marquer toutes les notifications comme lues',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, notificationController.markAllAsRead);
}
