import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteGalleryImageCommand } from '../commands/delete-gallery-image.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { IGalleryImageRepository, GALLERY_IMAGE_REPOSITORY } from '../../domain/repositories/gallery-image.repository.interface';

@CommandHandler(DeleteGalleryImageCommand)
export class DeleteGalleryImageHandler implements ICommandHandler<DeleteGalleryImageCommand> {
    constructor(
        @Inject(GALLERY_IMAGE_REPOSITORY) private readonly galleryRepository: IGalleryImageRepository,
    ) { }

    async execute(command: DeleteGalleryImageCommand): Promise<void> {
        const image = await this.galleryRepository.findById(command.id);
        if (!image) throw new NotFoundException('Gallery image not found');
        image.ensureOwner(command.requestingUserId);
        await this.galleryRepository.delete(command.id);
    }
}

