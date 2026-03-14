export class DonationEntity {
    constructor(
        public readonly id: string,
        public readonly amount: number,
        public readonly creatorId: string,
        public readonly festivalId: string,
        public readonly donorName: string | null = null,
        public readonly method: string | null = null,
        public readonly note: string | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!Number.isFinite(this.amount) || this.amount <= 0) {
            throw new Error('Donation amount must be a positive number');
        }
        if (!this.creatorId) {
            throw new Error('Donation creatorId is required');
        }
        if (!this.festivalId) {
            throw new Error('Donation festivalId is required');
        }
    }

    public updateDetails(amount: number, donorName: string | null, method: string | null, note: string | null, requestingUserId: string): void {
        this.ensureOwner(requestingUserId);
        (this as any).amount = amount;
        (this as any).donorName = donorName;
        (this as any).method = method;
        (this as any).note = note;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify donations you created');
        }
    }
}

