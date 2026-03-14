import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetPujaCurrentQuery } from '../../application/queries/get-puja-current.query';
import { GetPujaDashboardQuery } from '../../application/queries/get-puja-dashboard.query';
import { CreateVolunteerCommand } from '../../application/commands/create-volunteer.command';
import { UpdateVolunteerCommand } from '../../application/commands/update-volunteer.command';
import { DeleteVolunteerCommand } from '../../application/commands/delete-volunteer.command';
import { CreateDonationCommand } from '../../application/commands/create-donation.command';
import { CreateAnnouncementCommand } from '../../application/commands/create-announcement.command';
import { UpdateAnnouncementCommand } from '../../application/commands/update-announcement.command';
import { DeleteAnnouncementCommand } from '../../application/commands/delete-announcement.command';
import { CreateGalleryImageCommand } from '../../application/commands/create-gallery-image.command';
import { DeleteGalleryImageCommand } from '../../application/commands/delete-gallery-image.command';
import { ReorderGalleryImagesCommand } from '../../application/commands/reorder-gallery-images.command';

@ApiTags('puja')
@Controller('puja')
export class PujaController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) { }

    @Get('current')
    @ApiOperation({ summary: 'Get public current puja data (festival + schedule + pinned announcement + gallery)' })
    async getCurrent() {
        return this.queryBus.execute(new GetPujaCurrentQuery(new Date()));
    }

    @Get('dashboard')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get admin dashboard data for current festival' })
    async getDashboard() {
        return this.queryBus.execute(new GetPujaDashboardQuery(new Date()));
    }

    @Post('volunteers')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a volunteer/member entry' })
    async createVolunteer(
        @Body() body: { festivalId: string; name: string; role?: string; contact?: string },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new CreateVolunteerCommand(
            body.festivalId,
            req.user.userId,
            body.name,
            body.role,
            body.contact,
        ));
    }

    @Patch('volunteers/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update a volunteer/member entry' })
    async updateVolunteer(
        @Param('id') id: string,
        @Body() body: { name: string; role?: string; contact?: string },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new UpdateVolunteerCommand(
            id,
            req.user.userId,
            body.name,
            body.role,
            body.contact,
        ));
    }

    @Delete('volunteers/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a volunteer/member entry' })
    async deleteVolunteer(@Param('id') id: string, @Request() req: any) {
        return this.commandBus.execute(new DeleteVolunteerCommand(id, req.user.userId));
    }

    @Post('donations')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a donation entry' })
    async createDonation(
        @Body() body: { festivalId: string; amount: number; donorName?: string; method?: string; note?: string },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new CreateDonationCommand(
            body.festivalId,
            req.user.userId,
            body.amount,
            body.donorName,
            body.method,
            body.note,
        ));
    }

    @Post('announcements')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create an announcement (optionally pinned)' })
    async createAnnouncement(
        @Body() body: { festivalId: string; title: string; content: string; isPinned?: boolean; displayFrom?: string; displayTo?: string },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new CreateAnnouncementCommand(
            body.festivalId,
            req.user.userId,
            body.title,
            body.content,
            Boolean(body.isPinned),
            body.displayFrom ? new Date(body.displayFrom) : undefined,
            body.displayTo ? new Date(body.displayTo) : undefined,
        ));
    }

    @Patch('announcements/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update an announcement' })
    async updateAnnouncement(
        @Param('id') id: string,
        @Body() body: { title: string; content: string; isPinned?: boolean; displayFrom?: string; displayTo?: string },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new UpdateAnnouncementCommand(
            id,
            req.user.userId,
            body.title,
            body.content,
            Boolean(body.isPinned),
            body.displayFrom ? new Date(body.displayFrom) : undefined,
            body.displayTo ? new Date(body.displayTo) : undefined,
        ));
    }

    @Delete('announcements/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete an announcement' })
    async deleteAnnouncement(@Param('id') id: string, @Request() req: any) {
        return this.commandBus.execute(new DeleteAnnouncementCommand(id, req.user.userId));
    }

    @Post('gallery')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Add a gallery image by URL' })
    async createGalleryImage(
        @Body() body: { festivalId: string; url: string; caption?: string; order?: number },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new CreateGalleryImageCommand(
            body.festivalId,
            req.user.userId,
            body.url,
            body.caption,
            body.order ?? 0,
        ));
    }

    @Delete('gallery/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a gallery image' })
    async deleteGalleryImage(@Param('id') id: string, @Request() req: any) {
        return this.commandBus.execute(new DeleteGalleryImageCommand(id, req.user.userId));
    }

    @Patch('gallery/reorder')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Reorder gallery images for a festival' })
    async reorderGallery(
        @Body() body: { festivalId: string; updates: { id: string; order: number }[] },
        @Request() req: any,
    ) {
        return this.commandBus.execute(new ReorderGalleryImagesCommand(
            body.festivalId,
            req.user.userId,
            body.updates || [],
        ));
    }
}

