import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../commands/create-user.command';
import { Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRole } from '@ddd/shared';
import * as crypto from 'crypto';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async execute(command: CreateUserCommand): Promise<UserEntity> {
        const existingUser = await this.userRepository.findByEmail(command.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const newUser = new UserEntity(
            crypto.randomUUID(),
            command.email,
            command.name,
            UserRole.USER,
            new Date(),
            new Date(),
        );

        await this.userRepository.save(newUser);
        return newUser;
    }
}
