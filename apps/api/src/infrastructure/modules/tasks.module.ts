import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../../application/services/task.service';
import { PrismaTaskRepository } from '../repositories/prisma-task.repository';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { CreateDonationHandler } from '../../application/handlers/create-donation.handler';
import { PrismaDonationRepository } from '../repositories/prisma-donation.repository';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import { CreateGalleryImageHandler } from '../../application/handlers/create-gallery-image.handler';
import { DeleteGalleryImageHandler } from '../../application/handlers/delete-gallery-image.handler';
import { ReorderGalleryImagesHandler } from '../../application/handlers/reorder-gallery-images.handler';
import { PrismaGalleryImageRepository } from '../repositories/prisma-gallery-image.repository';
import { GALLERY_IMAGE_REPOSITORY } from '../../domain/repositories/gallery-image.repository.interface';

@Module({
    imports: [CqrsModule],
    controllers: [TaskController],
    providers: [
        TaskService,
        {
            provide: ITaskRepository,
            useClass: PrismaTaskRepository,
        },
        {
            provide: DONATION_REPOSITORY,
            useClass: PrismaDonationRepository,
        },
        {
            provide: GALLERY_IMAGE_REPOSITORY,
            useClass: PrismaGalleryImageRepository,
        },
        CreateDonationHandler,
        CreateGalleryImageHandler,
        DeleteGalleryImageHandler,
        ReorderGalleryImagesHandler,
    ],
    exports: [ITaskRepository, DONATION_REPOSITORY, GALLERY_IMAGE_REPOSITORY],
})
export class TasksModule { }
