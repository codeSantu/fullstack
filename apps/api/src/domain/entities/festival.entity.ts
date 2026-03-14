export class FestivalEntity {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly creatorId: string,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly description: string | null = null,
        public readonly location: string | null = null,
        public readonly bannerUrl: string | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Festival title cannot be empty');
        }
        if (this.endDate <= this.startDate) {
            throw new Error('Festival end date must be after start date');
        }
    }

    public updateDetails(title: string, startDate: Date, endDate: Date, description: string | null, location: string | null, bannerUrl: string | null, requestingUserId: string): void {
        this.ensureOwner(requestingUserId);
        (this as any).title = title;
        (this as any).startDate = startDate;
        (this as any).endDate = endDate;
        (this as any).description = description;
        (this as any).location = location;
        (this as any).bannerUrl = bannerUrl;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify festivals you organize');
        }
    }
}
