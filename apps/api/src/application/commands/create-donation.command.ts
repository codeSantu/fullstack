export class CreateDonationCommand {
    constructor(
        public readonly festivalId: string,
        public readonly creatorId: string,
        public readonly amount: number,
        public readonly donorName?: string,
        public readonly method?: string,
        public readonly note?: string,
    ) { }
}

