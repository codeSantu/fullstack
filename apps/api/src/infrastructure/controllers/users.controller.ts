import { Controller, Get, Patch, Body, Param, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.guard';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserRole } from '@ddd/shared';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    async getAllUsers() {
        const users = await this.userRepository.findAll();
        // Return sanitized users (omit passwords)
        return users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
        }));
    }

    @Patch(':id/role')
    @ApiOperation({ summary: 'Update user role (Admin only)' })
    async updateUserRole(
        @Param('id') id: string,
        @Body('role') role: UserRole
    ) {
        await this.userRepository.update(id, { role } as any);
        return { success: true };
    }
}
