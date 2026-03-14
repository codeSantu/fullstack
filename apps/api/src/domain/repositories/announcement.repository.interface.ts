import { AnnouncementEntity } from '../entities/announcement.entity';

export const ANNOUNCEMENT_REPOSITORY = Symbol('ANNOUNCEMENT_REPOSITORY');

export interface IAnnouncementRepository {
    findById(id: string): Promise<AnnouncementEntity | null>;
    findByFestivalId(festivalId: string): Promise<AnnouncementEntity[]>;
    findPinnedByFestivalId(festivalId: string, now?: Date): Promise<AnnouncementEntity | null>;
    unpinAllForFestival(festivalId: string): Promise<void>;
    save(announcement: AnnouncementEntity): Promise<void>;
    delete(id: string): Promise<void>;
}

