import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
