import { z } from 'zod';
import { UserController } from '../controllers/UserController.js';
const userController = new UserController();
export async function userRoutes(app) {
    app.post('/users', {
        schema: {
            body: z.object({
                name: z.string(),
                email: z.string().email().optional().nullable(),
                phoneNumber: z.string(),
                password: z.string(),
                role: z.enum(['CLIENT', 'SUPPLIER', 'ADMIN']),
            }),
        },
    }, userController.create);
}
