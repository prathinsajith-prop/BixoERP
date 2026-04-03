import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableUnique } from 'typeorm';

/**
 * Migration: Multi-Organisation Access Control
 *
 * Adds:
 *   1. membership_permissions   — direct permission overrides per user per org
 *   2. invite_tokens            — org invitation workflow
 *   3. ALTER user_organizations — add role_id, membership_type, employee_id, invited_by, left_at
 *   4. ALTER departments        — add parent_id, type, manager_id, lft, rgt, depth
 *   5. ALTER permissions        — add scope column, update unique index
 */
export class MultiOrgAccessControl1711900000000 implements MigrationInterface {
    name = 'MultiOrgAccessControl1711900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ─── 1. membership_permissions ───────────────────────────────────────────
        await queryRunner.createTable(
            new Table({
                name: 'membership_permissions',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
                    { name: 'membership_id', type: 'uuid', isNullable: false },
                    { name: 'permission_id', type: 'uuid', isNullable: false },
                    { name: 'is_granted', type: 'boolean', default: true },
                    { name: 'granted_by', type: 'uuid', isNullable: false },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                ],
                uniques: [
                    new TableUnique({ columnNames: ['membership_id', 'permission_id'] }),
                ],
                indices: [
                    new TableIndex({ columnNames: ['membership_id'] }),
                ],
            }),
            true,
        );

        // ─── 2. invite_tokens ────────────────────────────────────────────────────
        await queryRunner.createTable(
            new Table({
                name: 'invite_tokens',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
                    { name: 'token', type: 'varchar', length: '100', isUnique: true, isNullable: false },
                    { name: 'organisation_id', type: 'uuid', isNullable: false },
                    { name: 'invited_email', type: 'varchar', length: '255', isNullable: false },
                    { name: 'role_name', type: 'varchar', length: '100', isNullable: true },
                    { name: 'role_id', type: 'uuid', isNullable: true },
                    { name: 'invited_by', type: 'uuid', isNullable: false },
                    { name: 'status', type: 'varchar', length: '30', default: "'PENDING'" },
                    { name: 'message', type: 'text', isNullable: true },
                    { name: 'expires_at', type: 'timestamptz', isNullable: false },
                    { name: 'accepted_at', type: 'timestamptz', isNullable: true },
                    { name: 'accepted_by', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                ],
                indices: [
                    new TableIndex({ columnNames: ['token'] }),
                    new TableIndex({ columnNames: ['organisation_id'] }),
                    new TableIndex({ columnNames: ['invited_email'] }),
                ],
            }),
            true,
        );

        // ─── 3. ALTER user_organizations ─────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "role_id" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "membership_type" varchar(20) NOT NULL DEFAULT 'MEMBER'`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "employee_id" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "invited_by" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "left_at" timestamptz DEFAULT NULL`);

        // ─── 4. ALTER departments — nested set + type + parent ───────────────────
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "parent_id" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "type" varchar(30) NOT NULL DEFAULT 'DEPARTMENT'`);
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "manager_id" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "lft" int NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "rgt" int NOT NULL DEFAULT 2`);
        await queryRunner.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "depth" int NOT NULL DEFAULT 0`);

        // Index on lft/rgt for nested set queries
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_dept_nested_set" ON "departments" ("tenant_id", "organization_id", "lft", "rgt")`);

        // ─── 5. ALTER permissions — add scope, update unique constraint ───────────
        await queryRunner.query(`ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "scope" varchar(30) NOT NULL DEFAULT 'organisation'`);

        // Drop all existing unique constraints on (tenant_id, resource, action) variants and recreate with scope
        await queryRunner.query(`
            DO $$ DECLARE r RECORD; BEGIN
                FOR r IN SELECT constraint_name FROM information_schema.table_constraints
                         WHERE table_name = 'permissions' AND constraint_type = 'UNIQUE'
                           AND constraint_name != 'UQ_permissions_with_scope'
                LOOP
                    -- only drop if it covers resource + action but NOT scope
                    IF EXISTS (
                        SELECT 1 FROM information_schema.key_column_usage
                        WHERE constraint_name = r.constraint_name
                          AND column_name IN ('resource','action')
                        HAVING COUNT(*) >= 2
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.key_column_usage
                        WHERE constraint_name = r.constraint_name AND column_name = 'scope'
                    ) THEN
                        EXECUTE 'ALTER TABLE permissions DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                    END IF;
                END LOOP;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE table_name = 'permissions' AND constraint_name = 'UQ_permissions_with_scope'
                ) THEN
                    ALTER TABLE permissions ADD CONSTRAINT "UQ_permissions_with_scope" UNIQUE (tenant_id, resource, action, scope);
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse: scope from permissions
        await queryRunner.dropColumn('permissions', 'scope');

        // Reverse: nested set columns from departments
        await queryRunner.dropColumns('departments', ['parent_id', 'type', 'manager_id', 'lft', 'rgt', 'depth']);

        // Reverse: extra columns from user_organizations
        await queryRunner.dropColumns('user_organizations', ['role_id', 'membership_type', 'employee_id', 'invited_by', 'left_at']);

        // Drop tables
        await queryRunner.dropTable('invite_tokens', true);
        await queryRunner.dropTable('membership_permissions', true);
    }
}
