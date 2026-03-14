import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteEventCommand } from '../commands/delete-event.command';
import { Inject } from '@nestjs/common';
import { IEventRepository, EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';

@CommandHandler(DeleteEventCommand)
export class DeleteEventHandler implements ICommandHandler<DeleteEventCommand> {
    constructor(
        @Inject(EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    ) { }

    async execute(command: DeleteEventCommand): Promise<void> {
        const event = await this.eventRepository.findById(command.eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Row-level security logic enforced via Domain
        event.ensureOwner(command.requestingUserId);

        await this.eventRepository.delete(command.eventId);
    }
}
