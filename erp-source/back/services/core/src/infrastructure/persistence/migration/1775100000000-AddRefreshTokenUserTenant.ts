import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `user_tenant_id` column to `refresh_tokens`.
 *
 * When a user switches organizations, the refresh token is saved under the
 * target org's tenant_id (so the access token is scoped correctly), but
 * `user_tenant_id` records the user's HOME org where their user record lives.
 * This allows the refresh-token use case to find the user record even after
 * an org switch. NULL means same as tenant_id (standard login flow).
 */
export class AddRefreshTokenUserTenant1775100000000 implements MigrationInterface {
    name = 'AddRefreshTokenUserTenant1775100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "user_tenant_id" uuid DEFAULT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "user_tenant_id"`,
        );
    }
}
