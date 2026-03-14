export class VolunteerEntity {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly creatorId: string,
        public readonly festivalId: string,
        public readonly role: string | null = null,
        public readonly contact: string | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Volunteer name cannot be empty');
        }
        if (!this.creatorId) {
            throw new Error('Volunteer creatorId is required');
        }
        if (!this.festivalId) {
            throw new Error('Volunteer festivalId is required');
        }
    }

    public updateDetails(name: string, role: string | null, contact: string | null, requestingUserId: string): void {
        this.ensureOwner(requestingUserId);
        (this as any).name = name;
        (this as any).role = role;
        (this as any).contact = contact;
        (this as any).updatedAt = new Date();
        this.validate();
    }

    public ensureOwner(userId: string): void {
        if (this.creatorId !== userId) {
            throw new Error('Unauthorized: You can only modify volunteers you created');
        }
    }
}

