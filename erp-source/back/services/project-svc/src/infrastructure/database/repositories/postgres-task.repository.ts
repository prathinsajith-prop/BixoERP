import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../../domain/entities/task.entity';
import { TaskRepository } from '../../../domain/repositories/task.repository';
import { TaskStatus } from '../../../domain/value-objects/task-status';
import { TaskOrmEntity } from '../entities/task.orm-entity';

@Injectable()
export class PostgresTaskRepository implements TaskRepository {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly repo: Repository<TaskOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Task | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByProject(projectId: string, tenantId: string): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { projectId, tenantId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByAssignee(assigneeId: string, tenantId: string): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { assigneeId, tenantId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByMilestone(milestoneId: string, tenantId: string): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { milestoneId, tenantId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(task: Task): Promise<Task> {
    const entity = this.toOrm(task);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(task: Task): Promise<Task> {
    return this.save(task);
  }

  private toDomain(row: TaskOrmEntity): Task {
    return Task.fromPersistence(
      {
        projectId: row.projectId,
        title: row.title,
        description: row.description,
        status: TaskStatus.create(row.status),
        assigneeId: row.assigneeId,
        milestoneId: row.milestoneId,
        priority: row.priority,
        estimatedHours: Number(row.estimatedHours),
        actualHours: Number(row.actualHours),
        dueDate: row.dueDate,
        tenantId: row.tenantId,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(task: Task): TaskOrmEntity {
    const entity = new TaskOrmEntity();
    entity.id = task.id;
    entity.projectId = task.projectId;
    entity.title = task.title;
    entity.description = task.description;
    entity.status = task.status;
    entity.assigneeId = task.assigneeId;
    entity.milestoneId = task.milestoneId;
    entity.priority = task.priority;
    entity.estimatedHours = task.estimatedHours;
    entity.actualHours = task.actualHours;
    entity.dueDate = task.dueDate;
    entity.tenantId = task.tenantId;
    entity.createdBy = task.createdBy;
    entity.createdAt = task.createdAt;
    return entity;
  }
}
