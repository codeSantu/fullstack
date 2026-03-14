export class UpdateAnnouncementCommand {
    constructor(
        public readonly id: string,
        public readonly requestingUserId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly isPinned: boolean = false,
        public readonly displayFrom?: Date,
        public readonly displayTo?: Date,
    ) { }
}

