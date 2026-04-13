import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManifestData1775300000001 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE org_module_configs
        ADD COLUMN IF NOT EXISTS manifest_data JSONB;
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE org_module_configs
        DROP COLUMN IF EXISTS manifest_data;
    `);
    }
}
