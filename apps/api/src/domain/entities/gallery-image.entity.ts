export class GalleryImageEntity {
    constructor(
        public readonly id: string,
        public readonly url: string,
        public readonly creatorId: string,
        public readonly festivalId: string,
        public readonly caption: string | null = null,
        public readonly order: number = 0,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.url || this.url.trim().length === 0) {
            throw new Error('Gallery image url cannot be empty');
        }
        if (!this.creatorId) {
            throw new Error('Gallery image creatorId is required');
        }
        if (!this.festivalId) {
            throw new Error('Gallery image festivalId is required');
        }
        if (!Number.isInteger(this.order) || this.order < 0) {
            throw new Error('Gallery image order must be a non-negative integer');
        }
    }

    public updateDetails(url: string, caption: string | null, order: number, requestingUserId: string): void {
        this.ensureOwner(requestingUserId);
        (this as any).url = url;
        (this as any).caption = caption;
        (this as any).order = order;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify gallery images you created');
        }
    }
}

