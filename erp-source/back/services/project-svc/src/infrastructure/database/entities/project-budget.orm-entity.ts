import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';

@Entity('project_budgets')
@Index(['tenantId', 'projectId'], { unique: true })
export class ProjectBudgetOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'total_budget', type: 'numeric', precision: 19, scale: 4 })
  totalBudget!: string;

  @Column({ name: 'labor_budget', type: 'numeric', precision: 19, scale: 4 })
  laborBudget!: string;

  @Column({ name: 'material_budget', type: 'numeric', precision: 19, scale: 4 })
  materialBudget!: string;

  @Column({ name: 'actual_labor_cost', type: 'numeric', precision: 19, scale: 4, default: '0' })
  actualLaborCost!: string;

  @Column({ name: 'actual_material_cost', type: 'numeric', precision: 19, scale: 4, default: '0' })
  actualMaterialCost!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => ProjectOrmEntity, (project) => project.budget)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectOrmEntity;
}
