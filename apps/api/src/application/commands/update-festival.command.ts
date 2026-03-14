export class UpdateFestivalCommand {
    constructor(
        public readonly festivalId: string,
        public readonly requestingUserId: string,
        public readonly title: string,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly description?: string,
        public readonly location?: string,
        public readonly bannerUrl?: string,
    ) { }
}
