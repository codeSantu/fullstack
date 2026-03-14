export class CreateVolunteerCommand {
    constructor(
        public readonly festivalId: string,
        public readonly creatorId: string,
        public readonly name: string,
        public readonly role?: string,
        public readonly contact?: string,
    ) { }
}

