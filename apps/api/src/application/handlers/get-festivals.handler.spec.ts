import { GetFestivalsHandler } from './get-festivals.handler';
import { GetFestivalsQuery } from '../queries/get-festivals.query';
import { IFestivalRepository } from '../../domain/repositories/festival.repository.interface';
import { FestivalEntity } from '../../domain/entities/festival.entity';

describe('GetFestivalsHandler', () => {
    let handler: GetFestivalsHandler;
    let mockRepository: jest.Mocked<IFestivalRepository>;
    let mockRedis: any;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByCreatorId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;

        // Mocking redis service matching Phase 8 pattern
        mockRedis = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        }

        // In Phase 13 this logic will be injected. Injecting early for coverage.
        handler = new GetFestivalsHandler(mockRepository, mockRedis);
    });

    it('should return festivals from DB on cache miss', async () => {
        const mockEvents = [
            new FestivalEntity('1', 'F1', 'userA', new Date(), new Date('2026-10-10')),
        ];
        mockRedis.get.mockResolvedValueOnce(null);
        mockRepository.findByCreatorId.mockResolvedValueOnce(mockEvents);

        const query = new GetFestivalsQuery('userA');
        const result = await handler.execute(query);

        expect(result).toHaveLength(1);
        expect(mockRepository.findByCreatorId).toHaveBeenCalledWith('userA');
    });

    it('should return hydrated domain entities directly from Cache hit', async () => {
        const mockDbJSON = JSON.stringify([{ id: '99', title: 'Cached Fest', creatorId: 'userB', startDate: new Date().toISOString(), endDate: new Date('2026-12-12').toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        mockRedis.get.mockResolvedValueOnce(mockDbJSON);

        const query = new GetFestivalsQuery('userB');
        const result = await handler.execute(query);

        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(FestivalEntity);
        expect(result[0].title).toBe('Cached Fest');
        expect(mockRepository.findByCreatorId).not.toHaveBeenCalled();
    });
});
