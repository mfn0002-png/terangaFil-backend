import admin from 'firebase-admin';
import { INotificationProvider, SendNotificationData } from './INotificationProvider.js';
import { prisma } from '../database/prisma.js';

export class FirebaseNotificationProvider implements INotificationProvider {
  constructor() {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      if (Object.keys(serviceAccount).length > 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('🔥 [FIREBASE] Initialisé');
      } else {
        console.warn('⚠️ [FIREBASE] SERVICE_ACCOUNT manquant, notifications Firebase désactivées');
      }
    }
  }

  async sendNotification(userId: number, data: SendNotificationData): Promise<void> {
    // Le serveur TypeScript de l'IDE peut parfois mettre du temps à voir les nouveaux champs Prisma.
    // Si fcmToken est souligné en rouge, redémarrez le serveur TS (Cmd+Shift+P > Restart TS Server).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (user?.fcmToken) {
      try {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: {
            title: data.title,
            body: data.message,
          },
          data: {
            id: data.id.toString(),
            type: data.type,
            link: data.link || '',
            createdAt: data.createdAt.toISOString()
          }
        });
        console.log(`🔥 [FIREBASE] Notification envoyée à l'utilisateur #${userId}`);
      } catch (error: any) {
        console.error('❌ [FIREBASE ERROR] Échec de l\'envoi:', error.message);
      }
    } else {
      console.log(`🔥 [FIREBASE] Aucun FCM token pour l'utilisateur #${userId}, envoi ignoré`);
    }
  }
}
