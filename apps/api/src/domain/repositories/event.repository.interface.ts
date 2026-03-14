import { EventEntity } from '../entities/event.entity';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface IEventRepository {
    findById(id: string): Promise<EventEntity | null>;
    findByCreatorId(creatorId: string): Promise<EventEntity[]>;
    save(event: EventEntity): Promise<void>;
    delete(id: string): Promise<void>;
}
