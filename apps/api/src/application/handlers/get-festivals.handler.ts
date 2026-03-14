import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFestivalsQuery } from '../queries/get-festivals.query';
import { Inject } from '@nestjs/common';
import { IFestivalRepository, FESTIVAL_REPOSITORY } from '../../domain/repositories/festival.repository.interface';
import { FestivalEntity } from '../../domain/entities/festival.entity';
import { RedisService } from '../../infrastructure/cache/redis.service';

@QueryHandler(GetFestivalsQuery)
export class GetFestivalsHandler implements IQueryHandler<GetFestivalsQuery> {
    constructor(
        @Inject(FESTIVAL_REPOSITORY) private readonly festivalRepository: IFestivalRepository,
        private readonly redisService: RedisService,
    ) { }

    async execute(query: GetFestivalsQuery): Promise<{ items: FestivalEntity[], total: number }> {
        const skip = (query.page - 1) * query.limit;
        const take = query.limit;

        // For complex queries (search/pagination), we fallback to the database.
        // Cache is better suited for specific user views or "top festivals".
        return this.festivalRepository.findWithPagination(query.search, skip, take);
    }
}
