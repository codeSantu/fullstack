import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Member } from '../../domain/entities/member.entity';
import { IMemberRepository } from '../../domain/repositories/member.repository.interface';

@Injectable()
export class PrismaMemberRepository implements IMemberRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(member: Member): Promise<Member> {
        const created = await this.prisma.member.create({
            data: {
                id: member.id || undefined,
                name: member.name,
                designation: member.designation,
                phone: member.phone,
                address: member.address,
                bio: member.bio,
                avatarUrl: member.avatarUrl,
                userId: member.userId,
                organizationId: member.organizationId,
                fixedDonationAmount: member.fixedDonationAmount,
                fixedDonationStatus: member.fixedDonationStatus,
                lastNoticeSentAt: member.lastNoticeSentAt,
                noticeSentCount: member.noticeSentCount,
            },
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Member | null> {
        const found = await this.prisma.member.findUnique({
            where: { id },
            include: { user: true },
        });
        return found ? this.mapToEntity(found) : null;
    }

    async findByOrganizationId(organizationId: string): Promise<Member[]> {
        const members = await this.prisma.member.findMany({
            where: { organizationId },
            include: { user: true },
            orderBy: { name: 'asc' },
        });
        return members.map(this.mapToEntity);
    }

    async findByUserId(userId: string): Promise<Member | null> {
        const found = await this.prisma.member.findUnique({
            where: { userId },
            include: { user: true },
        });
        return found ? this.mapToEntity(found) : null;
    }

    async update(member: Member): Promise<Member> {
        const updated = await this.prisma.member.update({
            where: { id: member.id },
            data: {
                name: member.name,
                designation: member.designation,
                phone: member.phone,
                address: member.address,
                bio: member.bio,
                avatarUrl: member.avatarUrl,
                fixedDonationAmount: member.fixedDonationAmount,
                fixedDonationStatus: member.fixedDonationStatus,
                lastNoticeSentAt: member.lastNoticeSentAt,
                noticeSentCount: member.noticeSentCount,
            },
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.member.delete({
            where: { id },
        });
    }

    private mapToEntity(data: any): Member {
        return Member.create({
            id: data.id,
            name: data.name,
            designation: data.designation,
            phone: data.phone,
            address: data.address,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            userId: data.userId,
            organizationId: data.organizationId,
            fixedDonationAmount: data.fixedDonationAmount,
            fixedDonationStatus: data.fixedDonationStatus,
            lastNoticeSentAt: data.lastNoticeSentAt,
            noticeSentCount: data.noticeSentCount,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            user: data.user ? {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role,
            } as any : undefined,
        });
    }
}
