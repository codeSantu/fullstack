import { Task } from '../entities/task.entity';

export interface ITaskRepository {
    create(task: Task): Promise<Task>;
    findById(id: string): Promise<Task | null>;
    findByOrganizationId(organizationId: string): Promise<Task[]>;
    findByAssigneeId(assigneeId: string): Promise<Task[]>;
    update(task: Task): Promise<Task>;
    delete(id: string): Promise<void>;
}

export const ITaskRepository = Symbol('ITaskRepository');
