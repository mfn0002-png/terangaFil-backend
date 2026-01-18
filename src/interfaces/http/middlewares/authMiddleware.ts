import { FastifyReply, FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: 'Non authentifié.' });
  }
};

export const roleMiddleware = (allowedRoles: Role[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as { role: Role };
    
    if (!allowedRoles.includes(role)) {
      return reply.status(403).send({ message: 'Accès refusé. Rôle insuffisant.' });
    }
  };
};
