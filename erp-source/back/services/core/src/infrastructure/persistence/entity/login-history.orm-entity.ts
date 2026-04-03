import {
    Entity as TypeOrmEntity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@TypeOrmEntity('login_history')
@Index(['tenant_id', 'user_id'])
export class LoginHistoryOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    tenant_id: string;

    @Column('uuid')
    @Index()
    user_id: string;

    @Column({ type: 'varchar', length: 45, nullable: true })
    ip_address: string | null;

    @Column({ type: 'text', nullable: true })
    user_agent: string | null;

    /** SUCCESS | FAILURE */
    @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
    status: string;

    @Column({ type: 'text', nullable: true })
    failure_reason: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
