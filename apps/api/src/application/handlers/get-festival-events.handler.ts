import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFestivalEventsQuery } from '../queries/get-festival-events.query';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@QueryHandler(GetFestivalEventsQuery)
export class GetFestivalEventsHandler implements IQueryHandler<GetFestivalEventsQuery> {
    constructor(private readonly prisma: PrismaService) { }

    async execute(query: GetFestivalEventsQuery): Promise<any[]> {
        const events = await this.prisma.event.findMany({
            where: { festivalId: query.festivalId },
        });
        return events;
    }
}
