import { Task } from '../entities/task.entity';

export interface TaskRepository {
  findById(id: string, tenantId: string): Promise<Task | null>;
  findByProject(projectId: string, tenantId: string): Promise<Task[]>;
  findByAssignee(assigneeId: string, tenantId: string): Promise<Task[]>;
  findByMilestone(milestoneId: string, tenantId: string): Promise<Task[]>;
  save(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
}

export const TASK_REPOSITORY = Symbol('TaskRepository');
