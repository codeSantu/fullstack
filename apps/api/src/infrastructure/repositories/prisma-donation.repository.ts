import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { DonationEntity } from '../../domain/entities/donation.entity';

@Injectable()
export class PrismaDonationRepository implements IDonationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<DonationEntity | null> {
        const data = await this.prisma.donation.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByFestivalId(festivalId: string): Promise<DonationEntity[]> {
        const data = await this.prisma.donation.findMany({
            where: { festivalId },
            orderBy: { createdAt: 'desc' },
        });
        return data.map(d => this.mapToDomain(d));
    }

    async save(donation: DonationEntity): Promise<void> {
        const data = {
            id: donation.id,
            amount: Math.round(donation.amount),
            donorName: donation.donorName,
            method: donation.method,
            note: donation.note,
            creatorId: donation.creatorId,
            festivalId: donation.festivalId,
            updatedAt: donation.updatedAt,
        };

        await this.prisma.donation.upsert({
            where: { id: donation.id },
            update: data,
            create: { ...data, createdAt: donation.createdAt },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.donation.delete({ where: { id } });
    }

    private mapToDomain(data: any): DonationEntity {
        return new DonationEntity(
            data.id,
            data.amount,
            data.creatorId,
            data.festivalId,
            data.donorName,
            data.method,
            data.note,
            data.createdAt,
            data.updatedAt,
        );
    }
}

