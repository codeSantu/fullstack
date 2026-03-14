export class CreateEventCommand {
    constructor(
        public readonly title: string,
        public readonly creatorId: string,
        public readonly date: Date,
        public readonly description?: string,
        public readonly location?: string,
    ) { }
}
