import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../infrastructure/database/prisma.js';

export class FavoriteController {
  async toggle(request: FastifyRequest, reply: FastifyReply) {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);
    const { productId } = request.body as { productId: number };

    if (!productId) {
      return reply.status(400).send({ message: 'Product ID is required' });
    }

    try {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        });
        return reply.send({ isFavorite: false });
      } else {
        await prisma.favorite.create({
          data: {
            userId,
            productId,
          },
        });
        return reply.send({ isFavorite: true });
      }
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { sub } = request.user as { sub: string };
    const userId = Number(sub);

    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          product: {
            include: { supplier: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send(favorites);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }
}
