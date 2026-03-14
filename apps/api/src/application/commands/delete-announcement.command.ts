export class DeleteAnnouncementCommand {
    constructor(
        public readonly id: string,
        public readonly requestingUserId: string,
    ) { }
}

