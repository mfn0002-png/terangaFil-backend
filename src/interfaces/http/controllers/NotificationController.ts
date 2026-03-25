import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class NotificationController {
  /**
   * Liste les notifications de l'utilisateur connecté
   */
  async listMyNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as { id: number };
      const userId = user.id;
      const notifications = await prisma.notification.findMany({
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
      const user = request.user as { id: number };
      const userId = user.id;

      await prisma.notification.update({
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
      const user = request.user as { id: number };
      const userId = user.id;
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: 'Erreur lors de la mise à jour des notifications' });
    }
  }

  /**
   * Met à jour le token FCM de l'utilisateur
   */
  async updateFcmToken(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) {
    try {
      const fcmToken = request.body.token;
      const user = request.user as { id: number };
      const userId = user.id;

      if (!fcmToken) {
        return reply.status(400).send({ message: 'Token manquant' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });

      console.log(`📡 [FCM] Token mis à jour pour l'utilisateur #${userId}`);
      return reply.send({ success: true });
    } catch (error) {
      console.error('❌ [FCM ERROR] Erreur lors de la mise à jour du token:', error);
      return reply.status(500).send({ message: 'Erreur lors de la mise à jour du token FCM' });
    }
  }
}
