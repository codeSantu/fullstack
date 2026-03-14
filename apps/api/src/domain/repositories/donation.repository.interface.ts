import { DonationEntity } from '../entities/donation.entity';

export const DONATION_REPOSITORY = Symbol('DONATION_REPOSITORY');

export interface IDonationRepository {
    findById(id: string): Promise<DonationEntity | null>;
    findByFestivalId(festivalId: string): Promise<DonationEntity[]>;
    save(donation: DonationEntity): Promise<void>;
    delete(id: string): Promise<void>;
}

