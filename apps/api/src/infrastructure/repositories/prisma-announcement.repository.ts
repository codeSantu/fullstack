import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IAnnouncementRepository } from '../../domain/repositories/announcement.repository.interface';
import { AnnouncementEntity } from '../../domain/entities/announcement.entity';

@Injectable()
export class PrismaAnnouncementRepository implements IAnnouncementRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<AnnouncementEntity | null> {
        const data = await this.prisma.announcement.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByFestivalId(festivalId: string): Promise<AnnouncementEntity[]> {
        const data = await this.prisma.announcement.findMany({
            where: { festivalId },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        });
        return data.map(d => this.mapToDomain(d));
    }

    async findPinnedByFestivalId(festivalId: string, now: Date = new Date()): Promise<AnnouncementEntity | null> {
        const data = await this.prisma.announcement.findFirst({
            where: {
                festivalId,
                isPinned: true,
                AND: [
                    { OR: [{ displayFrom: null }, { displayFrom: { lte: now } }] },
                    { OR: [{ displayTo: null }, { displayTo: { gte: now } }] },
                ],
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async unpinAllForFestival(festivalId: string): Promise<void> {
        await this.prisma.announcement.updateMany({
            where: { festivalId, isPinned: true },
            data: { isPinned: false, updatedAt: new Date() },
        });
    }

    async save(announcement: AnnouncementEntity): Promise<void> {
        const data = {
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            isPinned: announcement.isPinned,
            displayFrom: announcement.displayFrom,
            displayTo: announcement.displayTo,
            creatorId: announcement.creatorId,
            festivalId: announcement.festivalId,
            updatedAt: announcement.updatedAt,
        };

        await this.prisma.announcement.upsert({
            where: { id: announcement.id },
            update: data,
            create: { ...data, createdAt: announcement.createdAt },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.announcement.delete({ where: { id } });
    }

    private mapToDomain(data: any): AnnouncementEntity {
        return new AnnouncementEntity(
            data.id,
            data.title,
            data.content,
            data.creatorId,
            data.festivalId,
            data.isPinned,
            data.displayFrom,
            data.displayTo,
            data.createdAt,
            data.updatedAt,
        );
    }
}

