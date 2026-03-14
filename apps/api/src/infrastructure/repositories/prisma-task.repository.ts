import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Task } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';

@Injectable()
export class PrismaTaskRepository implements ITaskRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(task: Task): Promise<Task> {
        const created = await this.prisma.task.create({
            data: {
                id: task.id || undefined,
                title: task.title,
                adminRemarks: task.adminRemarks,
                assigneeRemarks: task.assigneeRemarks,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                creatorId: task.creatorId,
                assigneeId: task.assigneeId,
                organizationId: task.organizationId,
            },
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Task | null> {
        const found = await this.prisma.task.findUnique({
            where: { id },
        });
        return found ? this.mapToEntity(found) : null;
    }

    async findByOrganizationId(organizationId: string): Promise<Task[]> {
        const tasks = await this.prisma.task.findMany({
            where: { organizationId },
        });
        return tasks.map(this.mapToEntity);
    }

    async findByAssigneeId(assigneeId: string): Promise<Task[]> {
        const tasks = await this.prisma.task.findMany({
            where: { assigneeId },
        });
        return tasks.map(this.mapToEntity);
    }

    async update(task: Task): Promise<Task> {
        const updated = await this.prisma.task.update({
            where: { id: task.id },
            data: {
                title: task.title,
                description: task.description,
                adminRemarks: task.adminRemarks,
                assigneeRemarks: task.assigneeRemarks,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
            },
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.task.delete({
            where: { id },
        });
    }

    private mapToEntity(data: any): Task {
        return Task.create({
            id: data.id,
            title: data.title,
            organizationId: data.organizationId,
            creatorId: data.creatorId,
            description: data.description,
            adminRemarks: data.adminRemarks,
            assigneeRemarks: data.assigneeRemarks,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            assigneeId: data.assigneeId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
