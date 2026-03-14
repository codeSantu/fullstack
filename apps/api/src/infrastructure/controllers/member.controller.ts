import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MemberService } from '../../application/services/member.service';
import { Member } from '../../domain/entities/member.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../security/roles.guard';
import { UserRole } from '@ddd/shared';
import { tenantContext } from '../context/tenant.context';

@ApiTags('members')
@ApiBearerAuth()
@Controller('members')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() data: any): Promise<Member> {
        return await this.memberService.createMember(data);
    }

    @Get()
    async findAll(@Query('organizationId') organizationId: string): Promise<Member[]> {
        if (!organizationId) {
            const store = tenantContext.getStore();
            organizationId = store?.organizationId;
        }
        return await this.memberService.getMembersByOrganization(organizationId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Member> {
        return await this.memberService.getMemberById(id);
    }

    @Get('user/:userId')
    async findByUserId(@Param('userId') userId: string): Promise<Member | null> {
        return await this.memberService.getMemberByUserId(userId);
    }

    @Patch('bulk-donation-status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async bulkUpdateDonationStatus(@Body() data: { memberIds: string[], status: string }): Promise<void> {
        await this.memberService.bulkUpdateDonationStatus(data.memberIds, data.status);
    }

    @Patch('bulk-notice')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async bulkRecordNotice(@Body() data: { memberIds: string[] }): Promise<void> {
        await this.memberService.bulkRecordNotice(data.memberIds);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER) // Allowing USER role too, but with check
    async update(@Param('id') id: string, @Body() data: any, @Req() req: any): Promise<Member> {
        return await this.handleUpdate(id, data, req);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.USER)
    async partialUpdate(@Param('id') id: string, @Body() data: any, @Req() req: any): Promise<Member> {
        return await this.handleUpdate(id, data, req);
    }

    private async handleUpdate(id: string, data: any, req: any): Promise<Member> {
        const user = req.user;
        const userRole = user.role?.toUpperCase() || '';
        const isAdmin = userRole === 'ADMIN';
        
        if (!isAdmin) {
            // Check if this member belongs to the logged in user
            const member = await this.memberService.getMemberById(id);
            if (!member || member.userId !== user.id) {
                throw new Error('You can only update your own profile');
            }
            
            // Prohibit non-admins from updating donation status
            const updateData = data as any;
            delete updateData.fixedDonationAmount;
            delete updateData.fixedDonationStatus;
            delete updateData.userId;
            delete updateData.organizationId;
            delete updateData.role;
        }

        return await this.memberService.updateMember(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<void> {
        await this.memberService.deleteMember(id);
    }
}
