import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@ddd/shared';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<UserEntity | null> {
        const data = await this.prisma.user.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const data = await this.prisma.user.findUnique({ where: { email } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findAll(): Promise<UserEntity[]> {
        const data = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return data.map(d => this.mapToDomain(d));
    }

    async save(user: UserEntity): Promise<void> {
        await this.prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email,
                name: user.name,
                role: typeof user.role === 'string' ? user.role : 'USER',
                updatedAt: user.updatedAt,
            },
            create: {
                id: user.id,
                email: user.email,
                name: user.name,
                password: 'hashed_password_mock', // For demonstration
                role: typeof user.role === 'string' ? user.role : 'USER',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }

    async update(id: string, updates: Partial<UserEntity>): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: {
                role: updates.role,
                name: updates.name,
                updatedAt: new Date(),
            }
        });
    }

    private mapToDomain(data: any): UserEntity {
        return new UserEntity(
            data.id,
            data.email,
            data.name,
            data.role as UserRole,
            data.createdAt,
            data.updatedAt,
        );
    }
}
