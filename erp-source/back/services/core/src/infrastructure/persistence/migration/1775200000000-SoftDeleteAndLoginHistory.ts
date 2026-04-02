import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteAndLoginHistory1775200000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // ── Soft delete columns ─────────────────────────────────────
        await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE permissions
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE divisions
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE departments
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        await queryRunner.query(`
      ALTER TABLE teams
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);

        // ── Login history table ──────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id          UUID PRIMARY KEY,
        tenant_id   UUID NOT NULL,
        user_id     UUID NOT NULL,
        ip_address  VARCHAR(45),
        user_agent  TEXT,
        status      VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
        failure_reason TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_history_tenant_user
        ON login_history (tenant_id, user_id);
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_history_user_id
        ON login_history (user_id);
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS login_history;`);

        for (const table of ['users', 'roles', 'permissions', 'organizations', 'divisions', 'departments', 'teams']) {
            await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS deleted_at;`);
        }
    }
}
