import { GetEventsHandler } from './get-events.handler';
import { GetEventsQuery } from '../queries/get-events.query';
import { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';

describe('GetEventsHandler', () => {
    let handler: GetEventsHandler;
    let mockRepository: jest.Mocked<IEventRepository>;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByCreatorId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;
        handler = new GetEventsHandler(mockRepository);
    });

    it('should return a list of events from the repository based on userId', async () => {
        const mockEvents = [
            new EventEntity('1', 'E1', 'userA', new Date()),
            new EventEntity('2', 'E2', 'userA', new Date()),
        ];
        mockRepository.findByCreatorId.mockResolvedValueOnce(mockEvents);

        const query = new GetEventsQuery('userA');
        const result = await handler.execute(query);

        expect(result).toHaveLength(2);
        expect(mockRepository.findByCreatorId).toHaveBeenCalledWith('userA');
    });
});
