export class CreateGalleryImageCommand {
    constructor(
        public readonly festivalId: string,
        public readonly creatorId: string,
        public readonly url: string,
        public readonly caption?: string,
        public readonly order: number = 0,
    ) { }
}

