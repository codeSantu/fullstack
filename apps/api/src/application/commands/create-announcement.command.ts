export class CreateAnnouncementCommand {
    constructor(
        public readonly festivalId: string,
        public readonly creatorId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly isPinned: boolean = false,
        public readonly displayFrom?: Date,
        public readonly displayTo?: Date,
    ) { }
}

