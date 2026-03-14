import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteAnnouncementCommand } from '../commands/delete-announcement.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { IAnnouncementRepository, ANNOUNCEMENT_REPOSITORY } from '../../domain/repositories/announcement.repository.interface';

@CommandHandler(DeleteAnnouncementCommand)
export class DeleteAnnouncementHandler implements ICommandHandler<DeleteAnnouncementCommand> {
    constructor(
        @Inject(ANNOUNCEMENT_REPOSITORY) private readonly announcementRepository: IAnnouncementRepository,
    ) { }

    async execute(command: DeleteAnnouncementCommand): Promise<void> {
        const announcement = await this.announcementRepository.findById(command.id);
        if (!announcement) throw new NotFoundException('Announcement not found');
        announcement.ensureOwner(command.requestingUserId);
        await this.announcementRepository.delete(command.id);
    }
}

