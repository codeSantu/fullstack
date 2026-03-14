import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetFestivalsQuery } from '../../application/queries/get-festivals.query';
import { GetFestivalEventsQuery } from '../../application/queries/get-festival-events.query';
import { CreateFestivalCommand } from '../../application/commands/create-festival.command';
import { UpdateFestivalCommand } from '../../application/commands/update-festival.command';
import { DeleteFestivalCommand } from '../../application/commands/delete-festival.command';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { S3Adapter } from '../adapters/s3.adapter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('festivals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('festivals')
export class FestivalsController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly s3Adapter: S3Adapter
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated festivals with optional search' })
    async getFestivals(
        @Request() req: any,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.queryBus.execute(new GetFestivalsQuery(
            undefined, // creatorId filter removed for general list, or add logic here
            search,
            page ? Number(page) : 1,
            limit ? Number(limit) : 10
        ));
    }

    @Get(':id/events')
    @ApiOperation({ summary: 'Get all events for a specific festival' })
    async getFestivalEvents(@Param('id') festivalId: string) {
        return this.queryBus.execute(new GetFestivalEventsQuery(festivalId));
    }

    @Post()
    @ApiOperation({ summary: 'Create a new festival' })
    async createFestival(
        @Body() body: {
            title: string;
            description?: string;
            location?: string;
            startDate: string;
            endDate: string;
            bannerUrl?: string;
        },
        @Request() req: any,
    ) {
        const creatorId = req.user.userId;
        return this.commandBus.execute(
            new CreateFestivalCommand(
                body.title,
                creatorId,
                new Date(body.startDate),
                new Date(body.endDate),
                body.description,
                body.location,
                body.bannerUrl,
            ),
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing festival' })
    async updateFestival(
        @Param('id') id: string,
        @Body() body: {
            title: string;
            description?: string;
            location?: string;
            startDate: string;
            endDate: string;
            bannerUrl?: string;
        },
        @Request() req: any,
    ) {
        const requestingUserId = req.user.userId;
        return this.commandBus.execute(
            new UpdateFestivalCommand(
                id,
                requestingUserId,
                body.title,
                new Date(body.startDate),
                new Date(body.endDate),
                body.description,
                body.location,
                body.bannerUrl,
            ),
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a festival by ID' })
    async deleteFestival(@Param('id') id: string, @Request() req: any) {
        return this.commandBus.execute(new DeleteFestivalCommand(id, req.user.userId));
    }

    @Post('upload-url')
    @ApiOperation({ summary: 'Generate a presigned S3 upload URL for a festival banner' })
    async getUploadUrl(@Body('filename') filename: string, @Body('contentType') contentType: string) {
        const bucketName = process.env.AWS_S3_BUCKET || 'festival-banners-bucket';
        const url = await this.s3Adapter.generatePresignedUrl(bucketName, filename, contentType);
        return { url };
    }
}
