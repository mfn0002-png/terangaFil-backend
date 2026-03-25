import { INotificationProvider, SendNotificationData } from './INotificationProvider.js';
import { webSocketService } from './WebSocketService.js';

export class WebSocketNotificationProvider implements INotificationProvider {
  async sendNotification(userId: number, data: SendNotificationData): Promise<void> {
    webSocketService.sendToUser(userId, {
      id: data.id,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      createdAt: data.createdAt
    });
  }
}
