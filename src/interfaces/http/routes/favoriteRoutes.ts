import { FastifyInstance } from 'fastify';
import { FavoriteController } from '../controllers/FavoriteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export async function favoriteRoutes(app: FastifyInstance) {
  const favoriteController = new FavoriteController();

  app.post('/favorites/toggle', { preHandler: [authMiddleware] }, favoriteController.toggle.bind(favoriteController));
  app.get('/favorites', { preHandler: [authMiddleware] }, favoriteController.list.bind(favoriteController));
}
