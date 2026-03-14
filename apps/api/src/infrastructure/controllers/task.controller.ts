import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { TaskService } from '../../application/services/task.service';
import { Task } from '../../domain/entities/task.entity';

@Controller('tasks')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post()
    async create(@Body() data: any): Promise<Task> {
        return await this.taskService.createTask(data);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Task> {
        return await this.taskService.getTaskById(id);
    }

    @Get('organization/:orgId')
    async findByOrg(@Param('orgId') orgId: string): Promise<Task[]> {
        return await this.taskService.getTasksByOrganization(orgId);
    }

    @Get('assignee/:userId')
    async findByAssignee(@Param('userId') userId: string): Promise<Task[]> {
        return await this.taskService.getTasksByAssignee(userId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<Task>): Promise<Task> {
        return await this.taskService.updateTask(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        await this.taskService.deleteTask(id);
    }
}
