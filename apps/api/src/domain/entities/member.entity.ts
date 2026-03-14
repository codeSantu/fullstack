import { UserEntity } from './user.entity';

export class Member {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly organizationId: string,
        public readonly designation?: string,
        public readonly phone?: string,
        public readonly address?: string,
        public readonly bio?: string,
        public readonly avatarUrl?: string,
        public readonly userId?: string,
        public readonly user?: UserEntity,
        public readonly fixedDonationAmount: number = 2000,
        public readonly fixedDonationStatus: string = 'PENDING',
        public readonly lastNoticeSentAt?: Date,
        public readonly noticeSentCount: number = 0,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) {}

    static create(props: {
        id?: string;
        name: string;
        organizationId: string;
        designation?: string;
        phone?: string;
        address?: string;
        bio?: string;
        avatarUrl?: string;
        userId?: string;
        user?: UserEntity;
        fixedDonationAmount?: number;
        fixedDonationStatus?: string;
        lastNoticeSentAt?: Date;
        noticeSentCount?: number;
        createdAt?: Date;
        updatedAt?: Date;
    }): Member {
        return new Member(
            props.id || '',
            props.name,
            props.organizationId,
            props.designation,
            props.phone,
            props.address,
            props.bio,
            props.avatarUrl,
            props.userId,
            props.user,
            props.fixedDonationAmount ?? 2000,
            props.fixedDonationStatus || 'PENDING',
            props.lastNoticeSentAt,
            props.noticeSentCount ?? 0,
            props.createdAt,
            props.updatedAt,
        );
    }
}
