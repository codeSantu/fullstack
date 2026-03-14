import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateFestivalCommand } from '../commands/update-festival.command';
import { Inject } from '@nestjs/common';
import { IFestivalRepository, FESTIVAL_REPOSITORY } from '../../domain/repositories/festival.repository.interface';
import { FestivalEntity } from '../../domain/entities/festival.entity';
import { LogService } from '../services/log.service';

@CommandHandler(UpdateFestivalCommand)
export class UpdateFestivalHandler implements ICommandHandler<UpdateFestivalCommand> {
    constructor(
        @Inject(FESTIVAL_REPOSITORY) private readonly festivalRepository: IFestivalRepository,
        private readonly logService: LogService,
    ) { }

    async execute(command: UpdateFestivalCommand): Promise<FestivalEntity> {
        const festival = await this.festivalRepository.findById(command.festivalId);
        if (!festival) {
            throw new Error('Festival not found');
        }

        // Role verification inside Domain:
        festival.updateDetails(
            command.title,
            command.startDate,
            command.endDate,
            command.description || null,
            command.location || null,
            command.bannerUrl || null,
            command.requestingUserId
        );

        await this.festivalRepository.save(festival);
        await this.logService.logAction('UPDATE', festival.id, command.requestingUserId, 'Updated festival details');
        return festival;
    }
}
