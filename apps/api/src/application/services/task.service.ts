import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';

@Injectable()
export class TaskService {
    constructor(
        @Inject(ITaskRepository)
        private readonly taskRepository: ITaskRepository,
    ) {}

    async createTask(data: {
        title: string;
        organizationId: string;
        creatorId: string;
        description?: string;
        adminRemarks?: string;
        assigneeRemarks?: string;
        priority?: string;
        dueDate?: Date;
        assigneeId?: string;
    }): Promise<Task> {
        const task = Task.create(data);
        return await this.taskRepository.create(task);
    }

    async getTaskById(id: string): Promise<Task> {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }

    async getTasksByOrganization(organizationId: string): Promise<Task[]> {
        return await this.taskRepository.findByOrganizationId(organizationId);
    }

    async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
        return await this.taskRepository.findByAssigneeId(assigneeId);
    }

    async updateTask(id: string, data: Partial<Task>): Promise<Task> {
        const existing = await this.getTaskById(id);
        const updated = Task.create({
            ...existing,
            ...data,
            id,
        });
        return await this.taskRepository.update(updated);
    }

    async deleteTask(id: string): Promise<void> {
        await this.getTaskById(id);
        await this.taskRepository.delete(id);
    }
}
