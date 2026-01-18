import { z } from 'zod';
import { PremiumController } from '../controllers/PremiumController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';
const premiumController = new PremiumController();
export async function premiumRoutes(app) {
    // Routes publiques
    app.get('/premium/plans', {
        schema: {
            description: 'Lister les plans d\'abonnement disponibles',
            tags: ['Premium'],
        },
    }, premiumController.listPlans);
    // Routes protégées fournisseur
    app.post('/premium/subscribe', {
        schema: {
            description: 'Souscrire à un plan premium',
            tags: ['Premium'],
            security: [{ bearerAuth: [] }],
            body: z.object({
                planName: z.enum(['PREMIUM', 'ULTIMATE']),
                paymentMethod: z.enum(['STRIPE', 'MOBILE_MONEY']),
            }),
        },
        preHandler: [authMiddleware, roleMiddleware([Role.SUPPLIER])],
    }, premiumController.subscribe);
    app.get('/premium/my-subscription', {
        schema: {
            description: 'Récupérer mon abonnement actuel',
            tags: ['Premium'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authMiddleware, roleMiddleware([Role.SUPPLIER])],
    }, premiumController.getMySubscription);
    app.get('/premium/stats', {
        schema: {
            description: 'Récupérer les statistiques avancées (Premium uniquement)',
            tags: ['Premium'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authMiddleware, roleMiddleware([Role.SUPPLIER])],
    }, premiumController.getStats);
    app.get('/premium/payments', {
        schema: {
            description: 'Récupérer l\'historique des paiements',
            tags: ['Premium'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authMiddleware, roleMiddleware([Role.SUPPLIER])],
    }, premiumController.getPayments);
}
