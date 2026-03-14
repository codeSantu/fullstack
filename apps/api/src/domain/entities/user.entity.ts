import { UserRole } from '@ddd/shared';

export class UserEntity {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        public readonly role: UserRole,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    public changeName(newName: string): void {
        // validation logic ...
    }
}
