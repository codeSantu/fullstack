import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('msgToServer')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string; groupId: string; content: string },
  ): Promise<void> {
    const message = await this.chatService.sendMessage(payload);
    this.server.to(payload.groupId).emit('msgToClient', message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, groupId: string): void {
    client.join(groupId);
    client.emit('joinedRoom', groupId);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, groupId: string): void {
    client.leave(groupId);
    client.emit('leftRoom', groupId);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
