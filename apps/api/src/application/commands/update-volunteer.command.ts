export class UpdateVolunteerCommand {
    constructor(
        public readonly id: string,
        public readonly requestingUserId: string,
        public readonly name: string,
        public readonly role?: string,
        public readonly contact?: string,
    ) { }
}

