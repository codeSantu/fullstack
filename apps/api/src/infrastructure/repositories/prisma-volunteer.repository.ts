import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerEntity } from '../../domain/entities/volunteer.entity';

@Injectable()
export class PrismaVolunteerRepository implements IVolunteerRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<VolunteerEntity | null> {
        const data = await this.prisma.volunteer.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByFestivalId(festivalId: string): Promise<VolunteerEntity[]> {
        const data = await this.prisma.volunteer.findMany({
            where: { festivalId },
            orderBy: { createdAt: 'asc' },
        });
        return data.map(d => this.mapToDomain(d));
    }

    async save(volunteer: VolunteerEntity): Promise<void> {
        const data = {
            id: volunteer.id,
            name: volunteer.name,
            role: volunteer.role,
            contact: volunteer.contact,
            creatorId: volunteer.creatorId,
            festivalId: volunteer.festivalId,
            updatedAt: volunteer.updatedAt,
        };

        await this.prisma.volunteer.upsert({
            where: { id: volunteer.id },
            update: data,
            create: { ...data, createdAt: volunteer.createdAt },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.volunteer.delete({ where: { id } });
    }

    private mapToDomain(data: any): VolunteerEntity {
        return new VolunteerEntity(
            data.id,
            data.name,
            data.creatorId,
            data.festivalId,
            data.role,
            data.contact,
            data.createdAt,
            data.updatedAt,
        );
    }
}

