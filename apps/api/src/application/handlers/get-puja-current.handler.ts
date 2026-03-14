import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPujaCurrentQuery } from '../queries/get-puja-current.query';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@QueryHandler(GetPujaCurrentQuery)
export class GetPujaCurrentHandler implements IQueryHandler<GetPujaCurrentQuery> {
    constructor(private readonly prisma: PrismaService) { }

    async execute(query: GetPujaCurrentQuery): Promise<any> {
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
                festivalTitle: 'No Active Festival',
                festivalSubtitle: '',
                scheduleDays: [],
                committeeSections: [],
                footer: { locations: [] },
                pinnedAnnouncement: null,
                galleryImages: [],
            };
        }

        const [scheduleEvents, volunteers, pinnedAnnouncement, galleryImages] = await Promise.all([
            this.prisma.event.findMany({
                where: { festivalId: festival.id },
                orderBy: { date: 'asc' },
            }),
            this.prisma.volunteer.findMany({
                where: { festivalId: festival.id },
                orderBy: { createdAt: 'asc' },
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

        // Parse JSON fields from festival config
        let scheduleDays = [];
        try {
            scheduleDays = festival.scheduleJson ? JSON.parse(festival.scheduleJson) : [];
        } catch (e) {
            console.error('Failed to parse scheduleJson', e);
        }

        let committeeSections = [];
        try {
            committeeSections = festival.committeeJson ? JSON.parse(festival.committeeJson) : [];
        } catch (e) {
            console.error('Failed to parse committeeJson', e);
        }

        let footer = { locations: [] };
        try {
            footer = festival.footerJson ? JSON.parse(festival.footerJson) : { locations: [] };
        } catch (e) {
            console.error('Failed to parse footerJson', e);
        }

        return {
            festivalTitle: festival.title,
            festivalSubtitle: festival.subtitle || '',
            scheduleDays,
            committeeSections,
            footer,
            pinnedAnnouncement,
            galleryImages,
            // Original festival object for reference
            _festival: festival,
        };
    }
}

