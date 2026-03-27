import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReviewController {
  // POST /reviews — Soumettre un avis (client authentifié)
  async submitReview(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).sub;
    const { productId, rating, comment } = request.body as {
      productId: number;
      rating: number;
      comment?: string;
    };

    // Vérifier que le client a commandé ce produit
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId: Number(userId) },
      },
    });

    if (!hasPurchased) {
      return reply.status(403).send({
        message: 'Vous devez avoir acheté ce produit pour laisser un avis.',
      });
    }

    // Vérifier qu'il n'a pas déjà laissé un avis
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: Number(userId), productId } },
    });

    if (existing) {
      return reply.status(409).send({ message: 'Vous avez déjà laissé un avis pour ce produit.' });
    }

    const review = await prisma.review.create({
      data: {
        userId: Number(userId),
        productId,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    return reply.status(201).send(review);
  }

  // GET /catalog/products/:id/reviews — Lire les avis d'un produit (public)
  async getProductReviews(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const productId = Number(id);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const average =
      total > 0
        ? Math.round((reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / total) * 10) / 10
        : 0;

    return reply.send({ reviews, stats: { total, average } });
  }
}
