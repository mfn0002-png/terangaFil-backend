import bcrypt from 'bcrypt';
export class CreateUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(data) {
        if (data.email) {
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser) {
                throw new Error('User already exists');
            }
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.userRepository.create({
            ...data,
            passwordHash
        });
    }
}
