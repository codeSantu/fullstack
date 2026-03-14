export class EventEntity {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly creatorId: string,
        public readonly date: Date,
        public readonly description: string | null = null,
        public readonly location: string | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Event title cannot be empty');
        }
    }

    public updateDetails(title: string, description: string | null, location: string | null, requestingUserId: string): void {
        this.ensureOwner(requestingUserId);
        (this as any).title = title;
        (this as any).description = description;
        (this as any).location = location;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify events you created');
        }
    }
}
