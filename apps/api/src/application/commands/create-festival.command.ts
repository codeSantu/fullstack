export class CreateFestivalCommand {
    constructor(
        public readonly title: string,
        public readonly creatorId: string,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly description?: string,
        public readonly location?: string,
        public readonly bannerUrl?: string,
    ) { }
}
