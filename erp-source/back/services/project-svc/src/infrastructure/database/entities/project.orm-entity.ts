import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { TaskOrmEntity } from './task.orm-entity';
import { MilestoneOrmEntity } from './milestone.orm-entity';
import { ProjectBudgetOrmEntity } from './project-budget.orm-entity';

@Entity('projects')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'managerId'])
export class ProjectOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 30 })
  code!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 20 })
  status!: string;

  @Column({ name: 'manager_id', type: 'uuid' })
  managerId!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => TaskOrmEntity, (task) => task.project, {
    cascade: true,
    eager: false,
  })
  tasks!: TaskOrmEntity[];

  @OneToMany(() => MilestoneOrmEntity, (milestone) => milestone.project, {
    cascade: true,
    eager: false,
  })
  milestones!: MilestoneOrmEntity[];

  @OneToOne(() => ProjectBudgetOrmEntity, (budget) => budget.project, {
    cascade: true,
    eager: false,
  })
  budget!: ProjectBudgetOrmEntity | null;
}
