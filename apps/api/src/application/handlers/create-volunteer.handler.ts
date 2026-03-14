import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateVolunteerCommand } from '../commands/create-volunteer.command';
import { Inject } from '@nestjs/common';
import { IVolunteerRepository, VOLUNTEER_REPOSITORY } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerEntity } from '../../domain/entities/volunteer.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateVolunteerCommand)
export class CreateVolunteerHandler implements ICommandHandler<CreateVolunteerCommand> {
    constructor(
        @Inject(VOLUNTEER_REPOSITORY) private readonly volunteerRepository: IVolunteerRepository,
    ) { }

    async execute(command: CreateVolunteerCommand): Promise<VolunteerEntity> {
        const volunteer = new VolunteerEntity(
            crypto.randomUUID(),
            command.name,
            command.creatorId,
            command.festivalId,
            command.role || null,
            command.contact || null,
            new Date(),
            new Date(),
        );

        await this.volunteerRepository.save(volunteer);
        return volunteer;
    }
}

