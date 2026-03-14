export class Task {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly organizationId: string,
        public readonly creatorId: string,
        public readonly description?: string,
        public readonly adminRemarks?: string,
        public readonly assigneeRemarks?: string,
        public readonly status: string = 'PENDING',
        public readonly priority: string = 'MEDIUM',
        public readonly dueDate?: Date,
        public readonly assigneeId?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) {}

    static create(props: {
        id?: string;
        title: string;
        organizationId: string;
        creatorId: string;
        description?: string;
        adminRemarks?: string;
        assigneeRemarks?: string;
        status?: string;
        priority?: string;
        dueDate?: Date;
        assigneeId?: string;
        createdAt?: Date;
        updatedAt?: Date;
    }): Task {
        return new Task(
            props.id || '',
            props.title,
            props.organizationId,
            props.creatorId,
            props.description,
            props.adminRemarks,
            props.assigneeRemarks,
            props.status ?? 'PENDING',
            props.priority ?? 'MEDIUM',
            props.dueDate,
            props.assigneeId,
            props.createdAt,
            props.updatedAt,
        );
    }
}
