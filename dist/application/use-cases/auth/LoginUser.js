import bcrypt from 'bcrypt';
import { prisma } from '../../../infrastructure/database/prisma.js';
export class LoginUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(data) {
        // Recherche par email OU par téléphone via casting any pour éviter les erreurs IDE
        const userDb = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.identifier },
                    { phoneNumber: data.identifier }
                ]
            }
        });
        if (!userDb) {
            throw new Error('Identifiants invalides.');
        }
        const isPasswordValid = await bcrypt.compare(data.password, userDb.password);
        if (!isPasswordValid) {
            throw new Error('Identifiants invalides.');
        }
        return {
            id: userDb.id,
            email: userDb.email,
            name: userDb.name,
            phoneNumber: userDb.phoneNumber,
            role: userDb.role,
        };
    }
}
