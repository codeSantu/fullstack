import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IFestivalRepository } from '../../domain/repositories/festival.repository.interface';
import { FestivalEntity } from '../../domain/entities/festival.entity';

@Injectable()
export class PrismaFestivalRepository implements IFestivalRepository {
    constructor(private prisma: PrismaService) { }

    async findById(id: string): Promise<FestivalEntity | null> {
        const data = await this.prisma.festival.findUnique({ where: { id } });
        if (!data) return null;
        return new FestivalEntity(data.id, data.title, data.creatorId, data.startDate, data.endDate, data.description, data.location, data.bannerUrl, data.createdAt, data.updatedAt);
    }

    async findByCreatorId(creatorId: string): Promise<FestivalEntity[]> {
        const data = await this.prisma.festival.findMany({ where: { creatorId } });
        return data.map(d => new FestivalEntity(d.id, d.title, d.creatorId, d.startDate, d.endDate, d.description, d.location, d.bannerUrl, d.createdAt, d.updatedAt));
    }

    async findAll(): Promise<FestivalEntity[]> {
        const data = await this.prisma.festival.findMany();
        return data.map(d => new FestivalEntity(d.id, d.title, d.creatorId, d.startDate, d.endDate, d.description, d.location, d.bannerUrl, d.createdAt, d.updatedAt));
    }

    async findWithPagination(search?: string, skip = 0, take = 10): Promise<{ items: FestivalEntity[], total: number }> {
        const where = search ? {
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { location: { contains: search } },
            ]
        } : {};

        const [items, total] = await Promise.all([
            this.prisma.festival.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.festival.count({ where })
        ]);

        return {
            items: items.map(d => new FestivalEntity(d.id, d.title, d.creatorId, d.startDate, d.endDate, d.description, d.location, d.bannerUrl, d.createdAt, d.updatedAt)),
            total
        };
    }

    async save(festival: FestivalEntity): Promise<void> {
        const data = {
            id: festival.id,
            title: festival.title,
            creatorId: festival.creatorId,
            startDate: festival.startDate,
            endDate: festival.endDate,
            description: festival.description,
            location: festival.location,
            bannerUrl: festival.bannerUrl,
            updatedAt: festival.updatedAt
        };

        await this.prisma.festival.upsert({
            where: { id: festival.id },
            update: data,
            create: { ...data, createdAt: festival.createdAt },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.festival.delete({ where: { id } });
    }
}
