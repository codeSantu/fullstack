import { Member } from '../entities/member.entity';

export interface IMemberRepository {
    create(member: Member): Promise<Member>;
    findById(id: string): Promise<Member | null>;
    findByOrganizationId(organizationId: string): Promise<Member[]>;
    findByUserId(userId: string): Promise<Member | null>;
    update(member: Member): Promise<Member>;
    delete(id: string): Promise<void>;
}

export const IMemberRepository = Symbol('IMemberRepository');
