import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { webSocketService } from '../../infrastructure/services/WebSocketService.js';

export const registerWebSocketRoutes = (app: FastifyInstance) => {
  app.get('/ws', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
    console.log('🔥 WS ROUTE HIT');

    const token = (req.query as any).token;

    if (!token) {
      console.log('🔌 [WS] Connexion refusée : Token manquant');
      socket.close(1008, 'Token required');
      return;
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decoded.sub ? Number(decoded.sub) : null;

      if (!userId) {
        socket.close(1008, 'Invalid payload');
        return;
      }

      webSocketService.registerConnection(userId, socket);
      console.log(`🔌 [WS] Utilisateur #${userId} connecté via WS`);

    } catch (err: any) {
      console.error('🔌 [WS] Erreur JWT:', err.name, '-', err.message);
      socket.close(1008, 'Invalid token');
    }
  });
};