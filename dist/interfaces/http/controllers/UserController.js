import { CreateUserUseCase } from '../../../application/use-cases/auth/CreateUser.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';
export class UserController {
    async create(request, reply) {
        const { name, email, phoneNumber, password, role } = request.body;
        const userRepository = new PrismaUserRepository();
        const createUserUseCase = new CreateUserUseCase(userRepository);
        try {
            const user = await createUserUseCase.execute({
                name,
                email,
                phoneNumber,
                password,
                role
            });
            return reply.status(201).send(user);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
