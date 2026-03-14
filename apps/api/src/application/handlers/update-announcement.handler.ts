import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateAnnouncementCommand } from '../commands/update-announcement.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { IAnnouncementRepository, ANNOUNCEMENT_REPOSITORY } from '../../domain/repositories/announcement.repository.interface';

@CommandHandler(UpdateAnnouncementCommand)
export class UpdateAnnouncementHandler implements ICommandHandler<UpdateAnnouncementCommand> {
    constructor(
        @Inject(ANNOUNCEMENT_REPOSITORY) private readonly announcementRepository: IAnnouncementRepository,
    ) { }

    async execute(command: UpdateAnnouncementCommand): Promise<void> {
        const announcement = await this.announcementRepository.findById(command.id);
        if (!announcement) throw new NotFoundException('Announcement not found');

        if (command.isPinned) {
            await this.announcementRepository.unpinAllForFestival(announcement.festivalId);
        }

        announcement.updateDetails(
            command.title,
            command.content,
            command.isPinned,
            command.displayFrom ?? null,
            command.displayTo ?? null,
            command.requestingUserId,
        );

        await this.announcementRepository.save(announcement);
    }
}

