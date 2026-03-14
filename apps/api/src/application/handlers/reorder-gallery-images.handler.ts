import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReorderGalleryImagesCommand } from '../commands/reorder-gallery-images.command';
import { Inject, ForbiddenException } from '@nestjs/common';
import { IGalleryImageRepository, GALLERY_IMAGE_REPOSITORY } from '../../domain/repositories/gallery-image.repository.interface';

@CommandHandler(ReorderGalleryImagesCommand)
export class ReorderGalleryImagesHandler implements ICommandHandler<ReorderGalleryImagesCommand> {
    constructor(
        @Inject(GALLERY_IMAGE_REPOSITORY) private readonly galleryRepository: IGalleryImageRepository,
    ) { }

    async execute(command: ReorderGalleryImagesCommand): Promise<void> {
        for (const update of command.updates) {
            const image = await this.galleryRepository.findById(update.id);
            if (!image) continue;
            if (image.festivalId !== command.festivalId) {
                throw new ForbiddenException('Cannot reorder images across festivals');
            }
            image.ensureOwner(command.requestingUserId);
            await this.galleryRepository.updateOrder(update.id, update.order);
        }
    }
}

