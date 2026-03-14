import { VolunteerEntity } from '../entities/volunteer.entity';

export const VOLUNTEER_REPOSITORY = Symbol('VOLUNTEER_REPOSITORY');

export interface IVolunteerRepository {
    findById(id: string): Promise<VolunteerEntity | null>;
    findByFestivalId(festivalId: string): Promise<VolunteerEntity[]>;
    save(volunteer: VolunteerEntity): Promise<void>;
    delete(id: string): Promise<void>;
}

