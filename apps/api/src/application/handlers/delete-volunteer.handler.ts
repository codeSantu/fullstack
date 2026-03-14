import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteVolunteerCommand } from '../commands/delete-volunteer.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { IVolunteerRepository, VOLUNTEER_REPOSITORY } from '../../domain/repositories/volunteer.repository.interface';

@CommandHandler(DeleteVolunteerCommand)
export class DeleteVolunteerHandler implements ICommandHandler<DeleteVolunteerCommand> {
    constructor(
        @Inject(VOLUNTEER_REPOSITORY) private readonly volunteerRepository: IVolunteerRepository,
    ) { }

    async execute(command: DeleteVolunteerCommand): Promise<void> {
        const volunteer = await this.volunteerRepository.findById(command.id);
        if (!volunteer) throw new NotFoundException('Volunteer not found');
        volunteer.ensureOwner(command.requestingUserId);
        await this.volunteerRepository.delete(command.id);
    }
}

