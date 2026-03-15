import { DeleteEventHandler } from './delete-event.handler';
import { DeleteEventCommand } from '../commands/delete-event.command';
import { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';

describe('DeleteEventHandler', () => {
    let handler: DeleteEventHandler;
    let mockRepository: jest.Mocked<IEventRepository>;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByCreatorId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;
        handler = new DeleteEventHandler(mockRepository);
    });

    it('should delete event successfully if requesting user is the owner', async () => {
        const event = new EventEntity('event-1', 'Title', 'owner-123', new Date());
        mockRepository.findById.mockResolvedValueOnce(event);

        const cmd = new DeleteEventCommand('event-1', 'owner-123');
        await handler.execute(cmd);

        expect(mockRepository.delete).toHaveBeenCalledWith('event-1');
    });

    it('should throw error if event does not exist', async () => {
        mockRepository.findById.mockResolvedValueOnce(null);

        const cmd = new DeleteEventCommand('event-404', 'owner-123');
        await expect(handler.execute(cmd)).rejects.toThrow('Event not found');
        expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw unauthorized error if requesting user is NOT the owner', async () => {
        const event = new EventEntity('event-1', 'Title', 'owner-123', new Date());
        mockRepository.findById.mockResolvedValueOnce(event);

        const cmd = new DeleteEventCommand('event-1', 'hacker-999');

        // Domain logic should throw the error
        await expect(handler.execute(cmd)).rejects.toThrow('Unauthorized: You can only modify events you created');
        expect(mockRepository.delete).not.toHaveBeenCalled();
    });
});
