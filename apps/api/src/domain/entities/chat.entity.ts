export class ChatGroup {
    constructor(
        public readonly id: string,
        public readonly organizationId: string,
        public readonly name?: string,
        public readonly isGroup: boolean = false,
        public readonly members?: any[],
        public readonly messages?: ChatMessage[],
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) {}

    static create(props: {
        id?: string;
        organizationId: string;
        name?: string;
        isGroup?: boolean;
        members?: any[];
        createdAt?: Date;
        updatedAt?: Date;
    }): ChatGroup {
        return new ChatGroup(
            props.id || '',
            props.organizationId,
            props.name,
            props.isGroup ?? false,
            props.members,
            [],
            props.createdAt,
            props.updatedAt,
        );
    }
}

export class ChatMessage {
    constructor(
        public readonly id: string,
        public readonly content: string,
        public readonly senderId: string,
        public readonly groupId: string,
        public readonly sender?: any,
        public readonly createdAt?: Date,
    ) {}

    static create(props: {
        id?: string;
        content: string;
        senderId: string;
        groupId: string;
        sender?: any;
        createdAt?: Date;
    }): ChatMessage {
        return new ChatMessage(
            props.id || '',
            props.content,
            props.senderId,
            props.groupId,
            props.sender,
            props.createdAt,
        );
    }
}
