import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateFestivalCommand } from '../commands/create-festival.command';
import { Inject } from '@nestjs/common';
import { IFestivalRepository, FESTIVAL_REPOSITORY } from '../../domain/repositories/festival.repository.interface';
import { LogService } from '../services/log.service';
import { FestivalEntity } from '../../domain/entities/festival.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateFestivalCommand)
export class CreateFestivalHandler implements ICommandHandler<CreateFestivalCommand> {
    constructor(
        @Inject(FESTIVAL_REPOSITORY) private readonly festivalRepository: IFestivalRepository,
        private readonly logService: LogService,
    ) { }

    async execute(command: CreateFestivalCommand): Promise<FestivalEntity> {
        const newFestival = new FestivalEntity(
            crypto.randomUUID(),
            command.title,
            command.creatorId,
            command.startDate,
            command.endDate,
            command.description || null,
            command.location || null,
            command.bannerUrl || null,
            new Date(),
            new Date(),
        );

        await this.festivalRepository.save(newFestival);
        await this.logService.logAction('CREATE', newFestival.id, command.creatorId, 'Created festival');
        return newFestival;
    }
}
