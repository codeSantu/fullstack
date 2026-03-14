import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChatGroup, ChatMessage } from '../../domain/entities/chat.entity';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';

@Injectable()
export class PrismaChatRepository implements IChatRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createGroup(group: ChatGroup): Promise<ChatGroup> {
        const created = await this.prisma.chatGroup.create({
            data: {
                id: group.id || undefined,
                name: group.name,
                isGroup: group.isGroup,
                organizationId: group.organizationId,
                members: {
                    connect: group.members?.map(m => ({ id: m.id })) || [],
                },
            },
            include: { members: true },
        });
        return this.mapGroupToEntity(created);
    }

    async findGroupById(id: string): Promise<ChatGroup | null> {
        const found = await this.prisma.chatGroup.findUnique({
            where: { id },
            include: { members: true },
        });
        return found ? this.mapGroupToEntity(found) : null;
    }

    async findGroupsByOrganizationId(organizationId: string): Promise<ChatGroup[]> {
        const groups = await this.prisma.chatGroup.findMany({
            where: { organizationId },
            include: { members: true },
        });
        return groups.map(this.mapGroupToEntity);
    }

    async findUserGroups(userId: string): Promise<ChatGroup[]> {
        const groups = await this.prisma.chatGroup.findMany({
            where: {
                members: {
                    some: { id: userId },
                },
            },
            include: { members: true },
        });
        return groups.map(this.mapGroupToEntity);
    }

    async addMemberToGroup(groupId: string, userId: string): Promise<void> {
        await this.prisma.chatGroup.update({
            where: { id: groupId },
            data: {
                members: {
                    connect: { id: userId },
                },
            },
        });
    }

    async saveMessage(message: ChatMessage): Promise<ChatMessage> {
        const created = await this.prisma.chatMessage.create({
            data: {
                id: message.id || undefined,
                content: message.content,
                senderId: message.senderId,
                groupId: message.groupId,
            },
            include: { sender: true },
        });
        return this.mapMessageToEntity(created);
    }

    async findMessagesByGroupId(groupId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
        // Ensure limit and offset are valid non-negative integers
        const take = isNaN(limit) ? 50 : Math.max(0, limit);
        const skip = isNaN(offset) ? 0 : Math.max(0, offset);

        const messages = await this.prisma.chatMessage.findMany({
            where: { groupId },
            take,
            skip,
            orderBy: { createdAt: 'desc' },
            include: { sender: true },
        });
        return messages.map(this.mapMessageToEntity);
    }

    async findPrivateGroup(userId1: string, userId2: string): Promise<ChatGroup | null> {
        const found = await this.prisma.chatGroup.findFirst({
            where: {
                isGroup: false,
                AND: [
                    { members: { some: { id: userId1 } } },
                    { members: { some: { id: userId2 } } },
                ],
            },
            include: { members: true },
        });
        return found ? this.mapGroupToEntity(found) : null;
    }

    private mapGroupToEntity(data: any): ChatGroup {
        return ChatGroup.create({
            id: data.id,
            name: data.name,
            isGroup: data.isGroup,
            organizationId: data.organizationId,
            members: data.members,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    private mapMessageToEntity(data: any): ChatMessage {
        return ChatMessage.create({
            id: data.id,
            content: data.content,
            senderId: data.senderId,
            groupId: data.groupId,
            sender: data.sender,
            createdAt: data.createdAt,
        });
    }
}
