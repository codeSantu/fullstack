import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ChatService } from '../../application/services/chat.service';
import { ChatGroup, ChatMessage } from '../../domain/entities/chat.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../security/roles.guard';
import { UserRole } from '@ddd/shared';

@Controller('chats')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post('groups')
    @UseGuards(JwtAuthGuard)
    async createGroup(@Body() data: any): Promise<ChatGroup> {
        return await this.chatService.createGroup(data);
    }

    @Get('groups/:id')
    @UseGuards(JwtAuthGuard)
    async getGroup(@Param('id') id: string): Promise<ChatGroup> {
        return await this.chatService.getGroup(id);
    }

    @Get('user/:userId/groups')
    @UseGuards(JwtAuthGuard)
    async getUserGroups(@Param('userId') userId: string): Promise<ChatGroup[]> {
        return await this.chatService.getUserGroups(userId);
    }

    @Post('messages')
    @UseGuards(JwtAuthGuard)
    async sendMessage(@Body() data: any): Promise<ChatMessage> {
        return await this.chatService.sendMessage(data);
    }

    @Get('groups/:groupId/messages')
    @UseGuards(JwtAuthGuard)
    async getMessages(
        @Param('groupId') groupId: string,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ): Promise<ChatMessage[]> {
        return await this.chatService.getGroupMessages(groupId, limit, offset);
    }

    @Post('broadcast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async broadcast(@Body() data: any): Promise<{ success: true }> {
        await this.chatService.broadcastMessage(data);
        return { success: true };
    }
}
