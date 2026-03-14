import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPujaDashboardQuery } from '../queries/get-puja-dashboard.query';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@QueryHandler(GetPujaDashboardQuery)
export class GetPujaDashboardHandler implements IQueryHandler<GetPujaDashboardQuery> {
    constructor(private readonly prisma: PrismaService) { }

    async execute(query: GetPujaDashboardQuery): Promise<any> {
        const now = query.now ?? new Date();

        const festival =
            await this.prisma.festival.findFirst({
                where: { endDate: { gte: now } },
                orderBy: { startDate: 'desc' },
            })
            ?? await this.prisma.festival.findFirst({
                orderBy: { createdAt: 'desc' },
            });

        if (!festival) {
            return {
                festival: null,
                scheduleEvents: [],
                volunteers: [],
                donations: [],
                donationTotal: 0,
                announcements: [],
                pinnedAnnouncement: null,
                galleryImages: [],
            };
        }

        const [scheduleEvents, volunteers, donations, announcements, pinnedAnnouncement, galleryImages] = await Promise.all([
            this.prisma.event.findMany({
                where: { festivalId: festival.id },
                orderBy: { date: 'asc' },
            }),
            this.prisma.volunteer.findMany({
                where: { festivalId: festival.id },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.donation.findMany({
                where: { festivalId: festival.id },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.announcement.findMany({
                where: { festivalId: festival.id },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.announcement.findFirst({
                where: {
                    festivalId: festival.id,
                    isPinned: true,
                    AND: [
                        { OR: [{ displayFrom: null }, { displayFrom: { lte: now } }] },
                        { OR: [{ displayTo: null }, { displayTo: { gte: now } }] },
                    ],
                },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.galleryImage.findMany({
                where: { festivalId: festival.id },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            }),
        ]);

        const donationTotal = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

        return {
            festival,
            scheduleEvents,
            volunteers,
            donations,
            donationTotal,
            announcements,
            pinnedAnnouncement,
            galleryImages,
        };
    }
}

