import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUser.js';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUser.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';
export class AuthController {
    async register(request, reply) {
        const { name, email, phoneNumber, password, role } = request.body;
        const userRepository = new PrismaUserRepository();
        const registerUseCase = new RegisterUserUseCase(userRepository);
        try {
            const user = await registerUseCase.execute({ name, email, phoneNumber, password, role });
            // Auto-login : générer le token directement après l'inscription
            const token = await reply.jwtSign({
                sub: user.id,
                email: user.email,
                role: user.role,
            });
            return reply.status(201).send({ token, user });
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
    async login(request, reply) {
        const { identifier, password } = request.body;
        const userRepository = new PrismaUserRepository();
        const loginUseCase = new LoginUserUseCase(userRepository);
        try {
            const user = await loginUseCase.execute({ identifier, password });
            const token = await reply.jwtSign({
                sub: user.id,
                email: user.email,
                role: user.role,
            });
            return reply.status(200).send({ token, user });
        }
        catch (error) {
            return reply.status(401).send({ message: error.message });
        }
    }
}
