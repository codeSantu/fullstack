export class DeleteFestivalCommand {
    constructor(
        public readonly festivalId: string,
        public readonly requestingUserId: string,
    ) { }
}
