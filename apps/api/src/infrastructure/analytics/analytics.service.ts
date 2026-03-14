import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        const [festivals, events] = await Promise.all([
            this.prisma.festival.findMany({
                select: { location: true },
            }),
            this.prisma.event.findMany({
                select: { date: true },
            }),
        ]);

        // Festivals by "category" (we use location from the database, falling back to "Unspecified")
        const categoryMap = new Map<string, number>();
        for (const fest of festivals) {
            const key = fest.location || 'Unspecified';
            categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
        }
        const festivalCategories = Array.from(categoryMap.entries()).map(([category, count]) => ({
            category,
            count,
        }));

        // Engagement trends derived from real events grouped by weekday
        const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const engagementMap = new Map<string, number>();
        for (const ev of events) {
            const label = weekdayLabels[ev.date.getDay()];
            engagementMap.set(label, (engagementMap.get(label) ?? 0) + 1);
        }
        const engagementTrends = weekdayLabels.map((label) => ({
            label,
            engagement: engagementMap.get(label) ?? 0,
        }));

        return {
            festivalCategories,
            engagementTrends,
        };
    }
}
