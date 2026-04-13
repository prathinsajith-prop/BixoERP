import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgModuleConfig1775300000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS org_module_configs (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id           UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        module_id        TEXT        NOT NULL,
        module_key       TEXT        NOT NULL,
        enabled          BOOLEAN     NOT NULL DEFAULT false,
        tier             TEXT,
        manifest_version TEXT,
        settings         JSONB       NOT NULL DEFAULT '{}',
        activated_at     TIMESTAMPTZ,
        deactivated_at   TIMESTAMPTZ,
        activated_by     UUID,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_org_module UNIQUE (org_id, module_id)
      );
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_org_module_configs_org
        ON org_module_configs (org_id);
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_org_module_configs_enabled
        ON org_module_configs (org_id, enabled);
    `);

        // Add code + is_system to roles table (needed for manifest role seeding)
        await queryRunner.query(`
      ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS code TEXT,
        ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;
    `);

        // Add code to permissions table (needed for manifest permission seeding)
        await queryRunner.query(`
      ALTER TABLE permissions
        ADD COLUMN IF NOT EXISTS code TEXT;
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code
        ON permissions (tenant_id, code)
        WHERE code IS NOT NULL;
    `);

        // Add unique index on roles code (needed for ON CONFLICT by code in seedRoles)
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_tenant_code
        ON roles (tenant_id, code)
        WHERE code IS NOT NULL;
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_roles_tenant_code;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_permissions_code;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_org_module_configs_enabled;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_org_module_configs_org;`);
        await queryRunner.query(`DROP TABLE IF EXISTS org_module_configs;`);
        await queryRunner.query(`ALTER TABLE roles DROP COLUMN IF EXISTS code, DROP COLUMN IF EXISTS is_system;`);
        await queryRunner.query(`ALTER TABLE permissions DROP COLUMN IF EXISTS code;`);
    }
}
