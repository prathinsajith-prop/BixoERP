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

@Entity('milestones')
@Index(['tenantId', 'projectId'])
export class MilestoneOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProjectOrmEntity, (project) => project.milestones)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectOrmEntity;
}
