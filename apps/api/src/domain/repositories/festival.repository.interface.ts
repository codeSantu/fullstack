import { FestivalEntity } from '../entities/festival.entity';

export const FESTIVAL_REPOSITORY = Symbol('FESTIVAL_REPOSITORY');

export interface IFestivalRepository {
    findById(id: string): Promise<FestivalEntity | null>;
    findByCreatorId(creatorId: string): Promise<FestivalEntity[]>;
    findWithPagination(search?: string, skip?: number, take?: number): Promise<{ items: FestivalEntity[], total: number }>;
    save(festival: FestivalEntity): Promise<void>;
    delete(id: string): Promise<void>;
}
