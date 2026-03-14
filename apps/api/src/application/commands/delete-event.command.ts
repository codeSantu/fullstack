export class DeleteEventCommand {
    constructor(
        public readonly eventId: string,
        public readonly requestingUserId: string,
    ) { }
}
