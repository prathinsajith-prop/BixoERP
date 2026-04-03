import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('departments')
@Index(['tenant_id', 'organization_id'])
@Index(['tenant_id', 'organization_id', 'code'], { unique: true })
export class DepartmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  organization_id: string;

  // Self-referencing parent for nested set model
  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  division_id: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, default: '' })
  code: string;

  // Division/department type for hierarchical display
  @Column({ length: 30, default: 'DEPARTMENT' })
  type: string; // COMPANY | DIVISION | DEPARTMENT | TEAM | BRANCH | COST_CENTER

  @Column({ type: 'text', default: '' })
  description: string;

  // Manager: FK → users (head of this dept)
  @Column({ type: 'uuid', nullable: true })
  head_user_id: string | null;

  // FK → employees in hr-svc
  @Column({ type: 'uuid', nullable: true })
  manager_id: string | null;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  // ─── Nested Set Model columns for O(1) subtree queries ───────
  @Column({ type: 'int', default: 1 })
  lft: number;

  @Column({ type: 'int', default: 2 })
  rgt: number;

  @Column({ type: 'int', default: 0 })
  depth: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
