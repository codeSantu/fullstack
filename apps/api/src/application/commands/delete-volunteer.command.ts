export class DeleteVolunteerCommand {
    constructor(
        public readonly id: string,
        public readonly requestingUserId: string,
    ) { }
}

