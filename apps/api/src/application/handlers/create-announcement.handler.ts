import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAnnouncementCommand } from '../commands/create-announcement.command';
import { Inject } from '@nestjs/common';
import { IAnnouncementRepository, ANNOUNCEMENT_REPOSITORY } from '../../domain/repositories/announcement.repository.interface';
import { AnnouncementEntity } from '../../domain/entities/announcement.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateAnnouncementCommand)
export class CreateAnnouncementHandler implements ICommandHandler<CreateAnnouncementCommand> {
    constructor(
        @Inject(ANNOUNCEMENT_REPOSITORY) private readonly announcementRepository: IAnnouncementRepository,
    ) { }

    async execute(command: CreateAnnouncementCommand): Promise<AnnouncementEntity> {
        if (command.isPinned) {
            await this.announcementRepository.unpinAllForFestival(command.festivalId);
        }

        const announcement = new AnnouncementEntity(
            crypto.randomUUID(),
            command.title,
            command.content,
            command.creatorId,
            command.festivalId,
            command.isPinned,
            command.displayFrom ?? null,
            command.displayTo ?? null,
            new Date(),
            new Date(),
        );

        await this.announcementRepository.save(announcement);
        return announcement;
    }
}

