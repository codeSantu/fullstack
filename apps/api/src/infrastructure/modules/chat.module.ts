import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../../application/services/chat.service';
import { ChatGateway } from '../../application/services/chat.gateway';
import { PrismaChatRepository } from '../repositories/prisma-chat.repository';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';
import { CreateAnnouncementHandler } from '../../application/handlers/create-announcement.handler';
import { UpdateAnnouncementHandler } from '../../application/handlers/update-announcement.handler';
import { DeleteAnnouncementHandler } from '../../application/handlers/delete-announcement.handler';
import { PrismaAnnouncementRepository } from '../repositories/prisma-announcement.repository';
import { ANNOUNCEMENT_REPOSITORY } from '../../domain/repositories/announcement.repository.interface';

@Module({
    imports: [CqrsModule],
    controllers: [ChatController],
    providers: [
        ChatService,
        ChatGateway,
        {
            provide: IChatRepository,
            useClass: PrismaChatRepository,
        },
        {
            provide: ANNOUNCEMENT_REPOSITORY,
            useClass: PrismaAnnouncementRepository,
        },
        CreateAnnouncementHandler,
        UpdateAnnouncementHandler,
        DeleteAnnouncementHandler,
    ],
    exports: [IChatRepository, ANNOUNCEMENT_REPOSITORY],
})
export class ChatModule { }
