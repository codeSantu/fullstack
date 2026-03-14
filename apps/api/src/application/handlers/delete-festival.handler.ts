import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteFestivalCommand } from '../commands/delete-festival.command';
import { Inject } from '@nestjs/common';
import { IFestivalRepository, FESTIVAL_REPOSITORY } from '../../domain/repositories/festival.repository.interface';
import { LogService } from '../services/log.service';

@CommandHandler(DeleteFestivalCommand)
export class DeleteFestivalHandler implements ICommandHandler<DeleteFestivalCommand> {
    constructor(
        @Inject(FESTIVAL_REPOSITORY) private readonly festivalRepository: IFestivalRepository,
        private readonly logService: LogService,
    ) { }

    async execute(command: DeleteFestivalCommand): Promise<void> {
        const festival = await this.festivalRepository.findById(command.festivalId);
        if (!festival) {
            throw new Error('Festival not found');
        }

        festival.ensureOwner(command.requestingUserId);

        await this.festivalRepository.delete(command.festivalId);
        await this.logService.logAction('DELETE', command.festivalId, command.requestingUserId, 'Deleted festival');
    }
}
