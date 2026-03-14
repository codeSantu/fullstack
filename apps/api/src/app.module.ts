import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WinstonModule } from 'nest-winston';
import { ThrottlerModule } from '@nestjs/throttler';
import { winstonConfig } from './infrastructure/logging/winston.config';
import { FestivalsController } from './infrastructure/controllers/festivals.controller';
import { UploadsController } from './infrastructure/controllers/uploads.controller';
import { PujaController } from './infrastructure/controllers/puja.controller';
import { GetFestivalsHandler } from './application/handlers/get-festivals.handler';
import { GetFestivalEventsHandler } from './application/handlers/get-festival-events.handler';
import { GetPujaCurrentHandler } from './application/handlers/get-puja-current.handler';
import { GetPujaDashboardHandler } from './application/handlers/get-puja-dashboard.handler';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisService } from './infrastructure/cache/redis.service';
import { S3Adapter } from './infrastructure/adapters/s3.adapter';
import { PrismaFestivalRepository } from './infrastructure/repositories/prisma-festival.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaVolunteerRepository } from './infrastructure/repositories/prisma-volunteer.repository';
import { PrismaDonationRepository } from './infrastructure/repositories/prisma-donation.repository';
import { PrismaAnnouncementRepository } from './infrastructure/repositories/prisma-announcement.repository';
import { PrismaGalleryImageRepository } from './infrastructure/repositories/prisma-gallery-image.repository';
import { FESTIVAL_REPOSITORY } from './domain/repositories/festival.repository.interface';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { VOLUNTEER_REPOSITORY } from './domain/repositories/volunteer.repository.interface';
import { DONATION_REPOSITORY } from './domain/repositories/donation.repository.interface';
import { ANNOUNCEMENT_REPOSITORY } from './domain/repositories/announcement.repository.interface';
import { GALLERY_IMAGE_REPOSITORY } from './domain/repositories/gallery-image.repository.interface';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './infrastructure/interceptors/tenant.interceptor';
import { LogService } from './application/services/log.service';
import { CreateFestivalHandler } from './application/handlers/create-festival.handler';
import { UpdateFestivalHandler } from './application/handlers/update-festival.handler';
import { DeleteFestivalHandler } from './application/handlers/delete-festival.handler';
import { CreateVolunteerHandler } from './application/handlers/create-volunteer.handler';
import { UpdateVolunteerHandler } from './application/handlers/update-volunteer.handler';
import { DeleteVolunteerHandler } from './application/handlers/delete-volunteer.handler';
import { CreateDonationHandler } from './application/handlers/create-donation.handler';
import { CreateAnnouncementHandler } from './application/handlers/create-announcement.handler';
import { UpdateAnnouncementHandler } from './application/handlers/update-announcement.handler';
import { DeleteAnnouncementHandler } from './application/handlers/delete-announcement.handler';
import { CreateGalleryImageHandler } from './application/handlers/create-gallery-image.handler';
import { DeleteGalleryImageHandler } from './application/handlers/delete-gallery-image.handler';
import { ReorderGalleryImagesHandler } from './application/handlers/reorder-gallery-images.handler';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './infrastructure/controllers/health.controller';
import { AuthModule } from './infrastructure/auth/auth.module';

import { AnalyticsModule } from './infrastructure/analytics/analytics.module';
import { UsersController } from './infrastructure/controllers/users.controller';

import { PrismaMemberRepository } from './infrastructure/repositories/prisma-member.repository';
import { IMemberRepository } from './domain/repositories/member.repository.interface';
import { MemberService } from './application/services/member.service';
import { MemberController } from './infrastructure/controllers/member.controller';

import { PrismaChatRepository } from './infrastructure/repositories/prisma-chat.repository';
import { IChatRepository } from './domain/repositories/chat.repository.interface';
import { ChatService } from './application/services/chat.service';
import { ChatController } from './infrastructure/controllers/chat.controller';

import { PrismaTaskRepository } from './infrastructure/repositories/prisma-task.repository';
import { ITaskRepository } from './domain/repositories/task.repository.interface';
import { TaskService } from './application/services/task.service';
import { TaskController } from './infrastructure/controllers/task.controller';
import { ChatGateway } from './application/services/chat.gateway';
import { FestivalSettingsController } from './infrastructure/controllers/festival-settings.controller';

@Module({
    imports: [
        CqrsModule,
        TerminusModule,
        AuthModule,
        AnalyticsModule,
        PrismaModule,
        WinstonModule.forRoot(winstonConfig),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
    ],
    controllers: [FestivalsController, PujaController, UploadsController, HealthController, UsersController, MemberController, ChatController, TaskController, FestivalSettingsController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: TenantInterceptor,
        },
        RedisService,
        S3Adapter,
        {
            provide: FESTIVAL_REPOSITORY,
            useClass: PrismaFestivalRepository,
        },
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository,
        },
        {
            provide: VOLUNTEER_REPOSITORY,
            useClass: PrismaVolunteerRepository,
        },
        {
            provide: DONATION_REPOSITORY,
            useClass: PrismaDonationRepository,
        },
        {
            provide: ANNOUNCEMENT_REPOSITORY,
            useClass: PrismaAnnouncementRepository,
        },
        {
            provide: GALLERY_IMAGE_REPOSITORY,
            useClass: PrismaGalleryImageRepository,
        },
        {
            provide: IMemberRepository,
            useClass: PrismaMemberRepository,
        },
        {
            provide: IChatRepository,
            useClass: PrismaChatRepository,
        },
        {
            provide: ITaskRepository,
            useClass: PrismaTaskRepository,
        },
        GetFestivalsHandler,
        GetFestivalEventsHandler,
        GetPujaCurrentHandler,
        GetPujaDashboardHandler,
        CreateFestivalHandler,
        UpdateFestivalHandler,
        DeleteFestivalHandler,
        CreateVolunteerHandler,
        UpdateVolunteerHandler,
        DeleteVolunteerHandler,
        CreateDonationHandler,
        CreateAnnouncementHandler,
        UpdateAnnouncementHandler,
        DeleteAnnouncementHandler,
        CreateGalleryImageHandler,
        DeleteGalleryImageHandler,
        ReorderGalleryImagesHandler,
        LogService,
        MemberService,
        ChatService,
        TaskService,
        ChatGateway,
    ],
})
export class AppModule { }
