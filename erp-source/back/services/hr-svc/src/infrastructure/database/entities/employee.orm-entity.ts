import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('employees')
@Index(['tenantId', 'employeeNumber'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'status'])
export class EmployeeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'employee_number', length: 30 })
  employeeNumber!: string;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth!: Date;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate!: Date | null;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column({ name: 'position_id', type: 'uuid' })
  positionId!: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId!: string | null;

  @Column({ length: 20 })
  status!: string; // ACTIVE, SUSPENDED, ON_LEAVE, PROBATION, TERMINATED

  @Column({ name: 'base_salary', type: 'numeric', precision: 19, scale: 4 })
  baseSalary!: string;

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
}
