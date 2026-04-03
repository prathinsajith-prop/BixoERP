import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add employee_code_sequences table and rename
 * employee_number → employee_code in the employees table.
 *
 * New employee code format: EMP-{YEAR}-{5-digit-sequence}
 * Example: EMP-2025-00001
 * Sequence resets to 00001 on 1 Jan of each calendar year, per organisation.
 */
export class AddEmployeeCodeSequences1700000002000 implements MigrationInterface {
    name = 'AddEmployeeCodeSequences1700000002000';

    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Rename the employee_number column to employee_code
        await queryRunner.query(`
      ALTER TABLE "employees"
        RENAME COLUMN "employee_number" TO "employee_code"
    `);

        // 2. Drop the old unique index that referenced employee_number
        await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_emp_tenant_number"
    `);

        // 3. Create a new unique index on the renamed column
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_emp_tenant_code"
        ON "employees" ("tenant_id", "employee_code")
    `);

        // 4. Create the employee_code_sequences table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_code_sequences" (
        "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "organisation_id" uuid    NOT NULL,
        "year"            integer NOT NULL,
        "last_sequence"   integer NOT NULL DEFAULT 0,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_code_sequences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ecs_org_year" UNIQUE ("organisation_id", "year")
      )
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecs_org_year"
        ON "employee_code_sequences" ("organisation_id", "year")
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "employee_code_sequences"`);

        await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_emp_tenant_code"
    `);

        await queryRunner.query(`
      ALTER TABLE "employees"
        RENAME COLUMN "employee_code" TO "employee_number"
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_emp_tenant_number"
        ON "employees" ("tenant_id", "employee_number")
    `);
    }
}
