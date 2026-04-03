import {
    Entity as TypeOrmEntity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    Index,
    Unique,
} from 'typeorm';

/**
 * Direct permission overrides per user per organisation.
 * Resolution order (first match wins):
 *   1. is_granted = false  → explicit DENY
 *   2. is_granted = true   → explicit GRANT
 *   3. role_permissions    → role check
 *   4. fallback            → DENY
 */
@TypeOrmEntity('membership_permissions')
@Unique(['membership_id', 'permission_id'])
export class MembershipPermissionOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    membership_id: string; // FK → user_org_memberships

    @Column('uuid')
    permission_id: string; // FK → permissions

    @Column({ type: 'boolean', default: true })
    is_granted: boolean; // true = explicit GRANT, false = explicit DENY

    @Column('uuid')
    granted_by: string; // FK → users (who set this override)

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
