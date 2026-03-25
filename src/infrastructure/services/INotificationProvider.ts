export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface SendNotificationData {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  createdAt: Date;
}

export interface INotificationProvider {
  sendNotification(userId: number, data: SendNotificationData): Promise<void>;
}
