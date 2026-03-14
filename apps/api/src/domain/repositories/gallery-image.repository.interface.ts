import { GalleryImageEntity } from '../entities/gallery-image.entity';

export const GALLERY_IMAGE_REPOSITORY = Symbol('GALLERY_IMAGE_REPOSITORY');

export interface IGalleryImageRepository {
    findById(id: string): Promise<GalleryImageEntity | null>;
    findByFestivalId(festivalId: string): Promise<GalleryImageEntity[]>;
    save(image: GalleryImageEntity): Promise<void>;
    delete(id: string): Promise<void>;
    updateOrder(id: string, order: number): Promise<void>;
}

