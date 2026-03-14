import { CreateEventHandler } from './create-event.handler';
import { CreateEventCommand } from '../commands/create-event.command';
import { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';

describe('CreateEventHandler', () => {
    let handler: CreateEventHandler;
    let mockRepository: jest.Mocked<IEventRepository>;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByCreatorId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;
        handler = new CreateEventHandler(mockRepository);
    });

    it('should successfully create an event and save to repository', async () => {
        const cmd = new CreateEventCommand('Test Title', 'user-1', new Date(), 'Desc', 'Loc');

        // Attempt execution
        const result = await handler.execute(cmd);

        // Checks
        expect(result).toBeInstanceOf(EventEntity);
        expect(result.title).toBe('Test Title');
        expect(mockRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRepository.save).toHaveBeenCalledWith(result);
    });
});
