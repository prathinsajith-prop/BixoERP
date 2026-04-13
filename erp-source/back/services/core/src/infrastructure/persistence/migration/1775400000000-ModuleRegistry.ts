import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModuleRegistry1775400000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // ── module_registry: global catalog of all known modules ─────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS module_registry (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id        TEXT        NOT NULL UNIQUE,
        module_key       TEXT        NOT NULL UNIQUE,
        module_name      TEXT        NOT NULL,
        current_version  TEXT        NOT NULL,
        previous_version TEXT,
        manifest         JSONB       NOT NULL,
        manifest_hash    TEXT        NOT NULL,
        tier             TEXT        NOT NULL DEFAULT 'standard',
        registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        // ── Extend org_module_configs with feature-level control columns ──
        await queryRunner.query(`
      ALTER TABLE org_module_configs
        ADD COLUMN IF NOT EXISTS adopted_version TEXT,
        ADD COLUMN IF NOT EXISTS pending_version  TEXT,
        ADD COLUMN IF NOT EXISTS feature_flags    JSONB NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS notes            TEXT;
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE org_module_configs
        DROP COLUMN IF EXISTS adopted_version,
        DROP COLUMN IF EXISTS pending_version,
        DROP COLUMN IF EXISTS feature_flags,
        DROP COLUMN IF EXISTS notes;
    `);
        await queryRunner.query(`DROP TABLE IF EXISTS module_registry;`);
    }
}
