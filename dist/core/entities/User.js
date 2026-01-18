export class User {
    id;
    name;
    email;
    phoneNumber;
    role;
    createdAt;
    constructor(id, name, email, phoneNumber, role, createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.createdAt = createdAt;
    }
}
