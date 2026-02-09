import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class NotificationController {
  /**
   * Liste les notifications de l'utilisateur connecté
   */
  async listMyNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      const notifications = await (prisma as any).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(notifications);
    } catch (error) {
      return reply.status(500).send({ message: 'Erreur lors de la récupération des notifications' });
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = (request.user as any).id;

      await (prisma as any).notification.update({
        where: { 
          id: Number(id),
          userId // Sécurité : vérifier que la notification appartient à l'utilisateur
        },
        data: { isRead: true },
      });

      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: 'Erreur lors de la mise à jour de la notification' });
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      await (prisma as any).notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: 'Erreur lors de la mise à jour des notifications' });
    }
  }
}
