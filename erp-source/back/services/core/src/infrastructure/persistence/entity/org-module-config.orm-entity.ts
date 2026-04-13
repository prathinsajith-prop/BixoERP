import {
    Entity as TypeOrmEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@TypeOrmEntity('org_module_configs')
@Index(['orgId', 'moduleId'], { unique: true })
@Index(['orgId', 'enabled'])
export class OrgModuleConfigOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'org_id', type: 'uuid' })
    @Index()
    orgId: string;

    @Column({ name: 'module_id' })
    moduleId: string;

    @Column({ name: 'module_key' })
    moduleKey: string;

    @Column({ default: false })
    enabled: boolean;

    @Column({ nullable: true, type: 'text' })
    tier: string | null;

    @Column({ name: 'manifest_version', nullable: true, type: 'text' })
    manifestVersion: string | null;

    @Column({ type: 'jsonb', default: () => "'{}'" })
    settings: Record<string, unknown>;

    @Column({ name: 'manifest_data', type: 'jsonb', nullable: true })
    manifestData: Record<string, unknown> | null;

    @Column({ name: 'activated_at', nullable: true, type: 'timestamptz' })
    activatedAt: Date | null;

    @Column({ name: 'deactivated_at', nullable: true, type: 'timestamptz' })
    deactivatedAt: Date | null;

    @Column({ name: 'activated_by', nullable: true, type: 'uuid' })
    activatedBy: string | null;

    @Column({ name: 'adopted_version', nullable: true, type: 'text' })
    adoptedVersion: string | null;

    @Column({ name: 'pending_version', nullable: true, type: 'text' })
    pendingVersion: string | null;

    @Column({ name: 'feature_flags', type: 'jsonb', default: () => "'{}'" })
    featureFlags: Record<string, boolean>;

    @Column({ nullable: true, type: 'text' })
    notes: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
