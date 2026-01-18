import { prisma } from '../database/prisma.js';
import { User } from '../../core/entities/User.js';
export class PrismaUserRepository {
    async create(data) {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                password: data.passwordHash,
                role: data.role,
            },
        });
        return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
    }
    async findByEmail(email) {
        if (!email)
            return null;
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user)
            return null;
        return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
    }
    async findByPhoneNumber(phoneNumber) {
        const user = await prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (!user)
            return null;
        return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
    }
    async findById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            return null;
        return new User(user.id, user.name, user.email, user.phoneNumber, user.role, user.createdAt);
    }
}
