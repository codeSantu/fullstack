import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateGalleryImageCommand } from '../commands/create-gallery-image.command';
import { Inject } from '@nestjs/common';
import { IGalleryImageRepository, GALLERY_IMAGE_REPOSITORY } from '../../domain/repositories/gallery-image.repository.interface';
import { GalleryImageEntity } from '../../domain/entities/gallery-image.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateGalleryImageCommand)
export class CreateGalleryImageHandler implements ICommandHandler<CreateGalleryImageCommand> {
    constructor(
        @Inject(GALLERY_IMAGE_REPOSITORY) private readonly galleryRepository: IGalleryImageRepository,
    ) { }

    async execute(command: CreateGalleryImageCommand): Promise<GalleryImageEntity> {
        const image = new GalleryImageEntity(
            crypto.randomUUID(),
            command.url,
            command.creatorId,
            command.festivalId,
            command.caption || null,
            command.order ?? 0,
            new Date(),
            new Date(),
        );

        await this.galleryRepository.save(image);
        return image;
    }
}

