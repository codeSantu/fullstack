import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateVolunteerCommand } from '../commands/update-volunteer.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { IVolunteerRepository, VOLUNTEER_REPOSITORY } from '../../domain/repositories/volunteer.repository.interface';

@CommandHandler(UpdateVolunteerCommand)
export class UpdateVolunteerHandler implements ICommandHandler<UpdateVolunteerCommand> {
    constructor(
        @Inject(VOLUNTEER_REPOSITORY) private readonly volunteerRepository: IVolunteerRepository,
    ) { }

    async execute(command: UpdateVolunteerCommand): Promise<void> {
        const volunteer = await this.volunteerRepository.findById(command.id);
        if (!volunteer) throw new NotFoundException('Volunteer not found');

        volunteer.updateDetails(
            command.name,
            command.role ?? null,
            command.contact ?? null,
            command.requestingUserId,
        );

        await this.volunteerRepository.save(volunteer);
    }
}

