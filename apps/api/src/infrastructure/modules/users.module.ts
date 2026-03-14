import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from '../controllers/users.controller';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

@Module({
    imports: [CqrsModule],
    controllers: [UsersController],
    providers: [
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository,
        },
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule { }
