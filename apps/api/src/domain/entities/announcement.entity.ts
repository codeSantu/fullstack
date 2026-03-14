export class AnnouncementEntity {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly content: string,
        public readonly creatorId: string,
        public readonly festivalId: string,
        public readonly isPinned: boolean = false,
        public readonly displayFrom: Date | null = null,
        public readonly displayTo: Date | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Announcement title cannot be empty');
        }
        if (!this.content || this.content.trim().length === 0) {
            throw new Error('Announcement content cannot be empty');
        }
        if (!this.creatorId) {
            throw new Error('Announcement creatorId is required');
        }
        if (!this.festivalId) {
            throw new Error('Announcement festivalId is required');
        }
        if (this.displayFrom && this.displayTo && this.displayTo <= this.displayFrom) {
            throw new Error('Announcement displayTo must be after displayFrom');
        }
    }

    public updateDetails(
        title: string,
        content: string,
        isPinned: boolean,
        displayFrom: Date | null,
        displayTo: Date | null,
        requestingUserId: string,
    ): void {
        this.ensureOwner(requestingUserId);
        (this as any).title = title;
        (this as any).content = content;
        (this as any).isPinned = isPinned;
        (this as any).displayFrom = displayFrom;
        (this as any).displayTo = displayTo;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify announcements you created');
        }
    }
}

