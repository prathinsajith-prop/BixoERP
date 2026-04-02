import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `status` column to `user_organizations` (org_memberships pivot).
 * Values: 'active' | 'inactive' | 'invited'
 * Existing rows default to 'active'.
 */
export class AddOrgMembershipStatus1775000000000 implements MigrationInterface {
    name = 'AddOrgMembershipStatus1775000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user_organizations" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'active'`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_user_org_status" ON "user_organizations" ("status")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_user_org_user_status" ON "user_organizations" ("user_id", "status")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_org_user_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_org_status"`);
        await queryRunner.query(`ALTER TABLE "user_organizations" DROP COLUMN IF EXISTS "status"`);
    }
}
