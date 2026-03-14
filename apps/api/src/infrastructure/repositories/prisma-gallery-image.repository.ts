import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IGalleryImageRepository } from '../../domain/repositories/gallery-image.repository.interface';
import { GalleryImageEntity } from '../../domain/entities/gallery-image.entity';

@Injectable()
export class PrismaGalleryImageRepository implements IGalleryImageRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<GalleryImageEntity | null> {
        const data = await this.prisma.galleryImage.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByFestivalId(festivalId: string): Promise<GalleryImageEntity[]> {
        const data = await this.prisma.galleryImage.findMany({
            where: { festivalId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        return data.map(d => this.mapToDomain(d));
    }

    async save(image: GalleryImageEntity): Promise<void> {
        const data = {
            id: image.id,
            url: image.url,
            caption: image.caption,
            order: image.order,
            creatorId: image.creatorId,
            festivalId: image.festivalId,
            updatedAt: image.updatedAt,
        };

        await this.prisma.galleryImage.upsert({
            where: { id: image.id },
            update: data,
            create: { ...data, createdAt: image.createdAt },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.galleryImage.delete({ where: { id } });
    }

    async updateOrder(id: string, order: number): Promise<void> {
        await this.prisma.galleryImage.update({
            where: { id },
            data: { order, updatedAt: new Date() },
        });
    }

    private mapToDomain(data: any): GalleryImageEntity {
        return new GalleryImageEntity(
            data.id,
            data.url,
            data.creatorId,
            data.festivalId,
            data.caption,
            data.order,
            data.createdAt,
            data.updatedAt,
        );
    }
}

