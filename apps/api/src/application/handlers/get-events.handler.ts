import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEventsQuery } from '../queries/get-events.query';
import { Inject } from '@nestjs/common';
import { IEventRepository, EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';

@QueryHandler(GetEventsQuery)
export class GetEventsHandler implements IQueryHandler<GetEventsQuery> {
    constructor(
        @Inject(EVENT_REPOSITORY) private readonly eventRepository: IEventRepository,
    ) { }

    async execute(query: GetEventsQuery): Promise<EventEntity[]> {
        return this.eventRepository.findByCreatorId(query.userId);
    }
}
