import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';

@Entity('tasks')
@Index(['tenantId', 'projectId'])
@Index(['tenantId', 'assigneeId'])
@Index(['tenantId', 'status'])
export class TaskOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 20 })
  status!: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Column({ name: 'milestone_id', type: 'uuid', nullable: true })
  milestoneId!: string | null;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  estimatedHours!: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  actualHours!: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: Date | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProjectOrmEntity, (project) => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectOrmEntity;
}
