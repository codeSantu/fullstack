export class DeleteGalleryImageCommand {
    constructor(
        public readonly id: string,
        public readonly requestingUserId: string,
    ) { }
}

