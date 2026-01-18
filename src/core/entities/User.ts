import { Role } from '@prisma/client';

export class User {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phoneNumber: string,
    public readonly role: Role,
    public readonly createdAt: Date
  ) {}
}
