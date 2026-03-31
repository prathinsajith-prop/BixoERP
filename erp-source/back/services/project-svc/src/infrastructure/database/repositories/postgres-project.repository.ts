import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Project } from '../../../domain/entities/project.entity';
import { Task, TaskProps } from '../../../domain/entities/task.entity';
import { Milestone, MilestoneProps } from '../../../domain/entities/milestone.entity';
import { ProjectBudget, ProjectBudgetProps } from '../../../domain/entities/project-budget.entity';
import { ProjectRepository } from '../../../domain/repositories/project.repository';
import { ProjectStatus } from '../../../domain/value-objects/project-status';
import { TaskStatus } from '../../../domain/value-objects/task-status';
import { Money } from '../../../domain/value-objects/money';
import { ProjectOrmEntity } from '../entities/project.orm-entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';
import { MilestoneOrmEntity } from '../entities/milestone.orm-entity';
import { ProjectBudgetOrmEntity } from '../entities/project-budget.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';

@Injectable()
export class PostgresProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly repo: Repository<ProjectOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<Project | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['tasks', 'milestones', 'budget'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<Project | null> {
    const row = await this.repo.findOne({
      where: { code, tenantId },
      relations: ['tasks', 'milestones', 'budget'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByTenant(tenantId: string): Promise<Project[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      relations: ['tasks', 'milestones', 'budget'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByManager(managerId: string, tenantId: string): Promise<Project[]> {
    const rows = await this.repo.find({
      where: { managerId, tenantId },
      relations: ['tasks', 'milestones', 'budget'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByStatus(status: string, tenantId: string): Promise<Project[]> {
    const rows = await this.repo.find({
      where: { status, tenantId },
      relations: ['tasks', 'milestones', 'budget'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(project: Project): Promise<Project> {
    const entity = this.toOrm(project);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(project: Project): Promise<Project> {
    return this.save(project);
  }

  async nextProjectCode(tenantId: string): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'count')
      .where('p.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `PRJ-${String(seq).padStart(5, '0')}`;
  }

  async existsByCode(code: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { code, tenantId },
    });
    return count > 0;
  }

  /** Save project + outbox event in the SAME transaction (Outbox Pattern) */
  async saveWithOutbox(project: Project): Promise<Project> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrm(project);
      const savedProject = await queryRunner.manager.save(ProjectOrmEntity, entity);

      // Write domain events to outbox in the same transaction
      const domainEvents = project.domainEvents;
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();
      return this.toDomain(savedProject);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: ProjectOrmEntity): Project {
    const tasks = (row.tasks || []).map((t) =>
      Task.fromPersistence(
        {
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: TaskStatus.create(t.status),
          assigneeId: t.assigneeId,
          milestoneId: t.milestoneId,
          priority: t.priority,
          estimatedHours: Number(t.estimatedHours),
          actualHours: Number(t.actualHours),
          dueDate: t.dueDate,
          tenantId: t.tenantId,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        },
        t.id,
      ),
    );

    const milestones = (row.milestones || []).map((m) =>
      Milestone.fromPersistence(
        {
          projectId: m.projectId,
          name: m.name,
          description: m.description,
          dueDate: m.dueDate,
          completedAt: m.completedAt,
          tenantId: m.tenantId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        },
        m.id,
      ),
    );

    let budget: ProjectBudget | null = null;
    if (row.budget) {
      const b = row.budget;
      budget = ProjectBudget.fromPersistence(
        {
          projectId: b.projectId,
          totalBudget: Money.create(b.totalBudget, b.currency),
          laborBudget: Money.create(b.laborBudget, b.currency),
          materialBudget: Money.create(b.materialBudget, b.currency),
          actualLaborCost: Money.create(b.actualLaborCost, b.currency),
          actualMaterialCost: Money.create(b.actualMaterialCost, b.currency),
          currency: b.currency,
          tenantId: b.tenantId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
        b.id,
      );
    }

    return Project.fromPersistence(
      {
        code: row.code,
        name: row.name,
        description: row.description,
        status: ProjectStatus.create(row.status),
        managerId: row.managerId,
        customerId: row.customerId,
        startDate: row.startDate,
        endDate: row.endDate,
        currency: row.currency,
        tenantId: row.tenantId,
        tasks,
        milestones,
        budget,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(project: Project): ProjectOrmEntity {
    const entity = new ProjectOrmEntity();
    entity.id = project.id;
    entity.code = project.code;
    entity.name = project.name;
    entity.description = project.description;
    entity.status = project.status;
    entity.managerId = project.managerId;
    entity.customerId = project.customerId;
    entity.startDate = project.startDate;
    entity.endDate = project.endDate;
    entity.currency = project.currency;
    entity.tenantId = project.tenantId;
    entity.createdBy = project.createdBy;
    entity.createdAt = project.createdAt;

    entity.tasks = project.tasks.map((t) => {
      const task = new TaskOrmEntity();
      task.id = t.id;
      task.projectId = project.id;
      task.title = t.title;
      task.description = t.description;
      task.status = t.status;
      task.assigneeId = t.assigneeId;
      task.milestoneId = t.milestoneId;
      task.priority = t.priority;
      task.estimatedHours = t.estimatedHours;
      task.actualHours = t.actualHours;
      task.dueDate = t.dueDate;
      task.tenantId = t.tenantId;
      task.createdBy = t.createdBy;
      task.createdAt = t.createdAt;
      return task;
    });

    entity.milestones = project.milestones.map((m) => {
      const milestone = new MilestoneOrmEntity();
      milestone.id = m.id;
      milestone.projectId = project.id;
      milestone.name = m.name;
      milestone.description = m.description;
      milestone.dueDate = m.dueDate;
      milestone.completedAt = m.completedAt;
      milestone.tenantId = m.tenantId;
      milestone.createdAt = m.createdAt;
      return milestone;
    });

    if (project.budget) {
      const b = project.budget;
      const budgetOrm = new ProjectBudgetOrmEntity();
      budgetOrm.id = b.id;
      budgetOrm.projectId = project.id;
      budgetOrm.totalBudget = b.totalBudget.amount;
      budgetOrm.laborBudget = b.laborBudget.amount;
      budgetOrm.materialBudget = b.materialBudget.amount;
      budgetOrm.actualLaborCost = b.actualLaborCost.amount;
      budgetOrm.actualMaterialCost = b.actualMaterialCost.amount;
      budgetOrm.currency = b.currency;
      budgetOrm.tenantId = b.tenantId;
      budgetOrm.createdAt = b.createdAt;
      entity.budget = budgetOrm;
    }

    return entity;
  }
}
