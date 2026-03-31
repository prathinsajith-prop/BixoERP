import { Inject, Injectable } from '@nestjs/common';
import { TimesheetEntry } from '../../domain/entities/timesheet-entry.entity';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import {
  TaskRepository,
  TASK_REPOSITORY,
} from '../../domain/repositories/task.repository';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  ProjectNotFoundException,
  TaskNotFoundException,
  BusinessRuleViolation,
} from '../../domain/exceptions/domain.exceptions';

export interface LogTimesheetInput {
  projectId: string;
  taskId?: string | null;
  employeeId: string;
  date: string;
  hours: number;
  description: string;
  billable?: boolean;
  tenantId: string;
}

export interface LogTimesheetOutput {
  id: string;
  projectId: string;
  taskId: string | null;
  employeeId: string;
  hours: number;
  date: string;
}

@Injectable()
export class LogTimesheetUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: TaskRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: LogTimesheetInput): Promise<LogTimesheetOutput> {
    // Validate project exists
    const project = await this.projectRepo.findById(input.projectId, input.tenantId);
    if (!project) {
      throw new ProjectNotFoundException(input.projectId);
    }

    if (project.statusVO.isTerminal()) {
      throw new BusinessRuleViolation('Cannot log time to a completed or cancelled project');
    }

    // Validate task exists if provided
    if (input.taskId) {
      const task = await this.taskRepo.findById(input.taskId, input.tenantId);
      if (!task) {
        throw new TaskNotFoundException(input.taskId);
      }
      if (task.statusVO.isTerminal()) {
        throw new BusinessRuleViolation('Cannot log time to a completed or cancelled task');
      }
      // Also log hours on the task entity
      task.logHours(input.hours);
      await this.taskRepo.update(task);
    }

    // Create timesheet entry
    const entry = TimesheetEntry.create({
      projectId: input.projectId,
      taskId: input.taskId ?? null,
      employeeId: input.employeeId,
      date: new Date(input.date),
      hours: input.hours,
      description: input.description,
      billable: input.billable,
      tenantId: input.tenantId,
    });

    // Invalidate cache
    await this.cache.delByPattern(`timesheets:${input.tenantId}:*`);

    return {
      id: entry.id,
      projectId: entry.projectId,
      taskId: entry.taskId,
      employeeId: entry.employeeId,
      hours: entry.hours,
      date: entry.date.toISOString(),
    };
  }
}
