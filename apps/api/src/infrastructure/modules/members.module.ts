import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MemberController } from '../controllers/member.controller';
import { MemberService } from '../../application/services/member.service';
import { PrismaMemberRepository } from '../repositories/prisma-member.repository';
import { IMemberRepository } from '../../domain/repositories/member.repository.interface';
import { CreateVolunteerHandler } from '../../application/handlers/create-volunteer.handler';
import { UpdateVolunteerHandler } from '../../application/handlers/update-volunteer.handler';
import { DeleteVolunteerHandler } from '../../application/handlers/delete-volunteer.handler';
import { PrismaVolunteerRepository } from '../repositories/prisma-volunteer.repository';
import { VOLUNTEER_REPOSITORY } from '../../domain/repositories/volunteer.repository.interface';

@Module({
    imports: [CqrsModule],
    controllers: [MemberController],
    providers: [
        MemberService,
        {
            provide: IMemberRepository,
            useClass: PrismaMemberRepository,
        },
        {
            provide: VOLUNTEER_REPOSITORY,
            useClass: PrismaVolunteerRepository,
        },
        CreateVolunteerHandler,
        UpdateVolunteerHandler,
        DeleteVolunteerHandler,
    ],
    exports: [IMemberRepository, VOLUNTEER_REPOSITORY],
})
export class MembersModule { }
