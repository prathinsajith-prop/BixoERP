import {
    Entity as TypeOrmEntity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@TypeOrmEntity('invite_tokens')
export class InviteTokenOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ length: 100, unique: true })
    @Index()
    token: string; // UUID sent in invitation email link

    @Column('uuid')
    @Index()
    organisation_id: string;

    @Column({ type: 'varchar', length: 255 })
    invited_email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    role_name: string | null; // role name to assign on acceptance

    @Column('uuid', { nullable: true })
    role_id: string | null; // FK → roles (if exists at invite time)

    @Column('uuid')
    invited_by: string; // FK → users

    @Column({ type: 'varchar', length: 30, default: 'PENDING' })
    status: string; // PENDING | ACCEPTED | EXPIRED | REVOKED

    @Column({ type: 'text', nullable: true })
    message: string | null; // optional personal message

    @Column({ type: 'timestamptz' })
    expires_at: Date; // 48 hours from creation

    @Column({ type: 'timestamptz', nullable: true })
    accepted_at: Date | null;

    @Column('uuid', { nullable: true })
    accepted_by: string | null; // FK → users (could differ from invited_email if shared link)

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
