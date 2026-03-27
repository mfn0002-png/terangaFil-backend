import { WebSocket } from 'ws';

export class WebSocketService {
  private static instance: WebSocketService;
  private connections: Map<number, WebSocket> = new Map(); // ← typé proprement

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public registerConnection(userId: number, socket: WebSocket) {
    this.connections.set(userId, socket);
    console.log(`🔌 [WS] Utilisateur #${userId} connecté`);

    socket.on('close', () => {
      this.connections.delete(userId);
      console.log(`🔌 [WS] Utilisateur #${userId} déconnecté`);
    });
  }

  public sendToUser(userId: number, data: any): boolean {
    const socket = this.connections.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
}

export const webSocketService = WebSocketService.getInstance();