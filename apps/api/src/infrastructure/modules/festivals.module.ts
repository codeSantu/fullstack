import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FestivalsController } from '../controllers/festivals.controller';
import { PujaController } from '../controllers/puja.controller';
import { FestivalSettingsController } from '../controllers/festival-settings.controller';
import { GetFestivalsHandler } from '../../application/handlers/get-festivals.handler';
import { GetFestivalEventsHandler } from '../../application/handlers/get-festival-events.handler';
import { GetPujaCurrentHandler } from '../../application/handlers/get-puja-current.handler';
import { GetPujaDashboardHandler } from '../../application/handlers/get-puja-dashboard.handler';
import { CreateFestivalHandler } from '../../application/handlers/create-festival.handler';
import { UpdateFestivalHandler } from '../../application/handlers/update-festival.handler';
import { DeleteFestivalHandler } from '../../application/handlers/delete-festival.handler';
import { PrismaFestivalRepository } from '../repositories/prisma-festival.repository';
import { FESTIVAL_REPOSITORY } from '../../domain/repositories/festival.repository.interface';

@Module({
    imports: [CqrsModule],
    controllers: [FestivalsController, PujaController, FestivalSettingsController],
    providers: [
        {
            provide: FESTIVAL_REPOSITORY,
            useClass: PrismaFestivalRepository,
        },
        GetFestivalsHandler,
        GetFestivalEventsHandler,
        GetPujaCurrentHandler,
        GetPujaDashboardHandler,
        CreateFestivalHandler,
        UpdateFestivalHandler,
        DeleteFestivalHandler,
    ],
    exports: [FESTIVAL_REPOSITORY],
})
export class FestivalsModule { }
