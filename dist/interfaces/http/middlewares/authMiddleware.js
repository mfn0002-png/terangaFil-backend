export const authMiddleware = async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ message: 'Non authentifié.' });
    }
};
export const roleMiddleware = (allowedRoles) => {
    return async (request, reply) => {
        const { role } = request.user;
        if (!allowedRoles.includes(role)) {
            return reply.status(403).send({ message: 'Accès refusé. Rôle insuffisant.' });
        }
    };
};
