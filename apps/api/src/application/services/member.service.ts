import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Member } from '../../domain/entities/member.entity';
import { IMemberRepository } from '../../domain/repositories/member.repository.interface';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@ddd/shared';

import { tenantContext } from '../../infrastructure/context/tenant.context';

@Injectable()
export class MemberService {
    constructor(
        @Inject(IMemberRepository)
        private readonly memberRepository: IMemberRepository,
        private readonly prisma: PrismaService,
    ) {}

    async createMember(data: {
        name: string;
        organizationId?: string;
        designation?: string;
        phone?: string;
        address?: string;
        bio?: string;
        avatarUrl?: string;
        userId?: string;
        email?: string;
        password?: string;
    }): Promise<Member> {
        let organizationId = data.organizationId;
        if (!organizationId) {
            const store = tenantContext.getStore();
            organizationId = store?.organizationId;
        }

        // If still missing, fallback to the first organization for single-tenant or stale session recovery
        if (!organizationId) {
            const firstOrg = await this.prisma.organization.findFirst();
            if (firstOrg) {
                organizationId = firstOrg.id;
            }
        }

        if (!organizationId) {
            throw new Error('Organization ID is required for member creation. Please ensure an organization exists.');
        }

        let userId = data.userId;

        if (data.email && !userId) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                // Check if this user is already a member
                const existingMember = await this.prisma.member.findUnique({
                    where: { userId: existingUser.id }
                });
                if (existingMember) {
                    throw new ConflictException('এই ইমেইলটি ইতিমধ্যে অন্য একজন সদস্যের দ্বারা ব্যবহৃত হচ্ছে।');
                }
                userId = existingUser.id;
            } else if (data.password) {
                const hashedPassword = await bcrypt.hash(data.password, 10);
                const user = await this.prisma.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        name: data.name,
                        role: UserRole.USER,
                        organizationId: organizationId,
                    },
                });
                userId = user.id;
            }
        }

        const member = Member.create({
            ...data,
            organizationId,
            userId,
        });
        return await this.memberRepository.create(member);
    }

    async getMemberById(id: string): Promise<Member> {
        const member = await this.memberRepository.findById(id);
        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }

    async getMembersByOrganization(organizationId: string): Promise<Member[]> {
        return await this.memberRepository.findByOrganizationId(organizationId);
    }

    async getMemberByUserId(userId: string): Promise<Member | null> {
        return await this.memberRepository.findByUserId(userId);
    }

    async updateMember(id: string, data: any): Promise<Member> {
        const existing = await this.getMemberById(id);
        
        // Sync with User record if exists
        if (existing.userId) {
            const userUpdateData: any = {};
            if (data.name) userUpdateData.name = data.name;
            if (data.email) userUpdateData.email = data.email;
            if (data.password) {
                userUpdateData.password = await bcrypt.hash(data.password, 10);
            }
            if (data.role) {
                userUpdateData.role = data.role;
            }

            if (Object.keys(userUpdateData).length > 0) {
                await this.prisma.user.update({
                    where: { id: existing.userId },
                    data: userUpdateData,
                });
            }
        }

        const updated = Member.create({
            ...existing,
            ...data,
            id,
        });
        return await this.memberRepository.update(updated);
    }

    async bulkUpdateDonationStatus(memberIds: string[], status: string): Promise<void> {
        await this.prisma.member.updateMany({
            where: {
                id: { in: memberIds },
            },
            data: {
                fixedDonationStatus: status,
            },
        });
    }

    async bulkRecordNotice(memberIds: string[]): Promise<void> {
        await this.prisma.member.updateMany({
            where: {
                id: { in: memberIds },
            },
            data: {
                lastNoticeSentAt: new Date(),
                noticeSentCount: {
                    increment: 1
                }
            },
        });
    }

    async deleteMember(id: string): Promise<void> {
        await this.getMemberById(id);
        await this.memberRepository.delete(id);
    }
}
