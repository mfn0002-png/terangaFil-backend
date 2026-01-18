import { z } from 'zod';
import { OrderController } from '../controllers/OrderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const orderController = new OrderController();
export async function orderRoutes(app) {
    app.post('/orders', {
        schema: {
            description: 'Passer une nouvelle commande multi-vendeurs',
            tags: ['Commandes'],
            security: [{ bearerAuth: [] }],
            body: z.object({
                shippingZone: z.string(),
                items: z.array(z.object({
                    productId: z.string().uuid(),
                    quantity: z.number().int().positive(),
                })).min(1),
            }),
        },
        preHandler: [authMiddleware],
    }, orderController.create);
}
