import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateDonationCommand } from '../commands/create-donation.command';
import { Inject } from '@nestjs/common';
import { IDonationRepository, DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import { DonationEntity } from '../../domain/entities/donation.entity';
import * as crypto from 'crypto';

@CommandHandler(CreateDonationCommand)
export class CreateDonationHandler implements ICommandHandler<CreateDonationCommand> {
    constructor(
        @Inject(DONATION_REPOSITORY) private readonly donationRepository: IDonationRepository,
    ) { }

    async execute(command: CreateDonationCommand): Promise<DonationEntity> {
        const donation = new DonationEntity(
            crypto.randomUUID(),
            command.amount,
            command.creatorId,
            command.festivalId,
            command.donorName || null,
            command.method || null,
            command.note || null,
            new Date(),
            new Date(),
        );

        await this.donationRepository.save(donation);
        return donation;
    }
}

