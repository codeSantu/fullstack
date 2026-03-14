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
            findWithPagination: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as any;

        mockRedis = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        };

        handler = new GetFestivalsHandler(mockRepository, mockRedis);
    });

    it('should return festivals from DB with pagination', async () => {
        const mockFestivals = [
            new FestivalEntity('1', 'F1', 'userA', new Date(), new Date('2026-10-10')),
        ];
        mockRepository.findWithPagination.mockResolvedValueOnce({ items: mockFestivals, total: 1 });

        // creatorId, search, page, limit
        const query = new GetFestivalsQuery('userA', '', 1, 10);
        const result = await handler.execute(query);

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith('', 0, 10);
    });

    it('should handle search term in pagination', async () => {
        const mockFestivals = [
            new FestivalEntity('1', 'Search Match', 'userA', new Date(), new Date('2026-10-10')),
        ];
        mockRepository.findWithPagination.mockResolvedValueOnce({ items: mockFestivals, total: 1 });

        // creatorId, search, page, limit
        const query = new GetFestivalsQuery('userA', 'Search', 1, 10);
        const result = await handler.execute(query);

        expect(result.items).toHaveLength(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith('Search', 0, 10);
    });
});
