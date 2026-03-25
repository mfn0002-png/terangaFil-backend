import nodemailer from 'nodemailer';
import { prisma } from '../database/prisma.js';
import { INotificationProvider, NotificationType } from './INotificationProvider.js';
import { WebSocketNotificationProvider } from './WebSocketNotificationProvider.js';
import { FirebaseNotificationProvider } from './FirebaseNotificationProvider.js';

export { NotificationType };

export interface SendNotificationOptions {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  emailOnly?: boolean;
}

export class NotificationService {
  private transporter;
  private provider: INotificationProvider;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Sélection du provider via variable d'environnement
    const providerType = process.env.NOTIFICATION_PROVIDER || 'websocket';
    if (providerType === 'firebase') {
      this.provider = new FirebaseNotificationProvider();
    } else {
      this.provider = new WebSocketNotificationProvider();
    }
    console.log(`🔔 [NOTIFICATION] Provider actif: ${providerType}`);
  }

  /**
   * Envoie une notification (Email + In-App par défaut)
   */
  async send(options: SendNotificationOptions) {
    const { userId, title, message, type = NotificationType.INFO, link, emailOnly = false } = options;

    try {
      let notification = null;

      // 1. In-App Notification (si pas emailOnly)
      if (!emailOnly) {
        notification = await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type,
            link,
          },
        });
        console.log(`🔔 [NOTIFICATION] In-App enregistrée pour l'utilisateur #${userId}: ${title}`);

        // 2. Temps Réel via Provider (WebSocket ou Firebase)
        await this.provider.sendNotification(userId, {
          id: notification.id,
          title,
          message,
          type,
          link,
          createdAt: notification.createdAt
        });
      }

      // 3. Email Notification
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await this.sendEmail(user.email, title, message, link);
        console.log(`📧 [EMAIL] Envoyé à ${user.email}: ${title}`);
      }

    } catch (error: any) {
      console.error(`❌ [NOTIFICATION ERROR]`, error.message);
    }
  }

  /**
   * Helper pour l'envoi d'email via Nodemailer
   */
  private async sendEmail(to: string, subject: string, text: string, link?: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #F0E6D2; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #3D2B1F; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Teranga Fil</h1>
        </div>
        <div style="padding: 40px; background-color: #FDFCFB;">
          <h2 style="color: #3D2B1F;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">${text}</p>
          ${link ? `
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL}${link}" style="background-color: #E07A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Voir les détails
              </a>
            </div>
          ` : ''}
        </div>
        <div style="background-color: #F0E6D2; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} Teranga Fil. Tous droits réservés.
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || '"Teranga Fil" <noreply@terangafil.com>',
      to,
      subject: `[Teranga Fil] ${subject}`,
      text,
      html,
    });
  }
}
