import {
    Entity as TypeOrmEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@TypeOrmEntity('module_registry')
export class ModuleRegistryOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'module_id', unique: true })
    moduleId: string;

    @Column({ name: 'module_key', unique: true })
    moduleKey: string;

    @Column({ name: 'module_name' })
    moduleName: string;

    @Column({ name: 'current_version' })
    currentVersion: string;

    @Column({ name: 'previous_version', nullable: true, type: 'text' })
    previousVersion: string | null;

    @Column({ type: 'jsonb' })
    manifest: Record<string, unknown>;

    @Column({ name: 'manifest_hash' })
    manifestHash: string;

    @Column({ default: 'standard' })
    tier: string;

    @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
    registeredAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
