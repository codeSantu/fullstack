export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    USER = 'USER',
    ORGANIZER = 'ORGANIZER',
    ADMIN = 'ADMIN'
}
