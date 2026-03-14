import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateEventCommand } from '../commands/create-event.command';
import { Inject } from '@nestjs/common';
import { IEventRepository, EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand> {
    constructor(
        @Inject(EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    ) { }

    async execute(command: CreateEventCommand): Promise<EventEntity> {
        const newEvent = new EventEntity(
            crypto.randomUUID(),
            command.title,
            command.creatorId,
            command.date,
            command.description || null,
            command.location || null,
            new Date(),
            new Date(),
        );

        await this.eventRepository.save(newEvent);
        return newEvent;
    }
}
