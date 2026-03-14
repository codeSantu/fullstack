import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../security/roles.guard';
import { UserRole } from '@ddd/shared';

@ApiTags('festival-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('festival-settings')
export class FestivalSettingsController {
    constructor(private readonly prisma: PrismaService) { }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update festival CMS settings (title, subtitle, schedule, committee, footer)' })
    async updateSettings(
        @Param('id') id: string,
        @Body() body: {
            title?: string;
            subtitle?: string;
            scheduleJson?: any;
            committeeJson?: any;
            footerJson?: any;
        },
    ) {
        return this.prisma.festival.update({
            where: { id },
            data: {
                title: body.title,
                subtitle: body.subtitle,
                scheduleJson: body.scheduleJson ? JSON.stringify(body.scheduleJson) : undefined,
                committeeJson: body.committeeJson ? JSON.stringify(body.committeeJson) : undefined,
                footerJson: body.footerJson ? JSON.stringify(body.footerJson) : undefined,
            },
        });
    }
}
