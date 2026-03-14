export type GalleryImageOrderUpdate = { id: string; order: number };

export class ReorderGalleryImagesCommand {
    constructor(
        public readonly festivalId: string,
        public readonly requestingUserId: string,
        public readonly updates: GalleryImageOrderUpdate[],
    ) { }
}

