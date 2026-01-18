import bcrypt from 'bcrypt';
export class RegisterUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(data) {
        if (data.email) {
            const existingEmail = await this.userRepository.findByEmail(data.email);
            if (existingEmail) {
                throw new Error('Cet email est déjà utilisé.');
            }
        }
        const existingPhone = await this.userRepository.findByPhoneNumber(data.phoneNumber);
        if (existingPhone) {
            throw new Error('Ce numéro de téléphone est déjà utilisé.');
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.userRepository.create({
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            passwordHash,
            role: data.role,
        });
    }
}
