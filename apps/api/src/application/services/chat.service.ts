import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ChatGroup, ChatMessage } from '../../domain/entities/chat.entity';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';

@Injectable()
export class ChatService {
    constructor(
        @Inject(IChatRepository)
        private readonly chatRepository: IChatRepository,
    ) {}

    async createGroup(data: {
        organizationId: string;
        name?: string;
        isGroup?: boolean;
        memberIds: string[];
    }): Promise<ChatGroup> {
        const group = ChatGroup.create({
            organizationId: data.organizationId,
            name: data.name,
            isGroup: data.isGroup,
            members: data.memberIds.map(id => ({ id })),
        });
        return await this.chatRepository.createGroup(group);
    }

    async getGroup(id: string): Promise<ChatGroup> {
        const group = await this.chatRepository.findGroupById(id);
        if (!group) {
            throw new NotFoundException(`Chat group with ID ${id} not found`);
        }
        return group;
    }

    async getUserGroups(userId: string): Promise<ChatGroup[]> {
        return await this.chatRepository.findUserGroups(userId);
    }

    async sendMessage(data: {
        content: string;
        senderId: string;
        groupId: string;
    }): Promise<ChatMessage> {
        const message = ChatMessage.create(data);
        return await this.chatRepository.saveMessage(message);
    }

    async getGroupMessages(groupId: string, limit?: number, offset?: number): Promise<ChatMessage[]> {
        return await this.chatRepository.findMessagesByGroupId(groupId, limit, offset);
    }

    async broadcastMessage(data: {
        content: string;
        senderId: string;
        organizationId: string;
        recipientIds: string[];
    }): Promise<void> {
        for (const recipientId of data.recipientIds) {
            if (recipientId === data.senderId) continue;

            let group = await this.chatRepository.findPrivateGroup(data.senderId, recipientId);
            
            if (!group) {
                group = await this.createGroup({
                    organizationId: data.organizationId,
                    isGroup: false,
                    memberIds: [data.senderId, recipientId],
                });
            }

            await this.sendMessage({
                content: data.content,
                senderId: data.senderId,
                groupId: group.id,
            });
        }
    }
}
