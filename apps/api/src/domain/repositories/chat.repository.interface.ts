import { ChatGroup, ChatMessage } from '../entities/chat.entity';

export interface IChatRepository {
    createGroup(group: ChatGroup): Promise<ChatGroup>;
    findGroupById(id: string): Promise<ChatGroup | null>;
    findGroupsByOrganizationId(organizationId: string): Promise<ChatGroup[]>;
    findUserGroups(userId: string): Promise<ChatGroup[]>;
    addMemberToGroup(groupId: string, userId: string): Promise<void>;
    
    saveMessage(message: ChatMessage): Promise<ChatMessage>;
    findMessagesByGroupId(groupId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
    findPrivateGroup(userId1: string, userId2: string): Promise<ChatGroup | null>;
}

export const IChatRepository = Symbol('IChatRepository');
