import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('employee_code_sequences')
@Unique(['organisationId', 'year'])
@Index(['organisationId', 'year'])
export class EmployeeCodeSequenceOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId!: string;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ name: 'last_sequence', type: 'integer', default: 0 })
  lastSequence!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
