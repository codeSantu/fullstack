import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WinstonModule } from 'nest-winston';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { winstonConfig } from './infrastructure/logging/winston.config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { AnalyticsModule } from './infrastructure/analytics/analytics.module';

import { InfrastructureModule } from './infrastructure/modules/infrastructure.module';
import { FestivalsModule } from './infrastructure/modules/festivals.module';
import { MembersModule } from './infrastructure/modules/members.module';
import { ChatModule } from './infrastructure/modules/chat.module';
import { TasksModule } from './infrastructure/modules/tasks.module';
import { UsersModule } from './infrastructure/modules/users.module';

import { TenantInterceptor } from './infrastructure/interceptors/tenant.interceptor';
import { LogService } from './application/services/log.service';
import { HealthController } from './infrastructure/controllers/health.controller';
import { UploadsController } from './infrastructure/controllers/uploads.controller';

@Module({
    imports: [
        CqrsModule,
        TerminusModule,
        AuthModule,
        AnalyticsModule,
        PrismaModule,
        InfrastructureModule,
        FestivalsModule,
        MembersModule,
        ChatModule,
        TasksModule,
        UsersModule,
        WinstonModule.forRoot(winstonConfig),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
    ],
    controllers: [UploadsController, HealthController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: TenantInterceptor,
        },
    ],
})
export class AppModule { }
