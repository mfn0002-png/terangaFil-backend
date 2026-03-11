export class WebSocketService {
  private static instance: WebSocketService;
  private connections: Map<number, any> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Enregistre une nouvelle connexion WebSocket pour un utilisateur
   */
  public registerConnection(userId: number, connection: any) {
    this.connections.set(userId, connection);
    console.log(`🔌 [WS] Utilisateur #${userId} connecté`);

    connection.socket.on('close', () => {
      this.connections.delete(userId);
      console.log(`🔌 [WS] Utilisateur #${userId} déconnecté`);
    });
  }

  /**
   * Envoie un message en temps réel à un utilisateur spécifique
   */
  public sendToUser(userId: number, data: any) {
    const connection = this.connections.get(userId);
    if (connection && connection.socket.readyState === 1) { // 1 = OPEN
      connection.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
}

export const webSocketService = WebSocketService.getInstance();
