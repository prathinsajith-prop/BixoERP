import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration for hr_db.
 * Reflects all tables as they existed before the employee-code-sequences feature.
 */
export class InitHrSchema1700000001000 implements MigrationInterface {
    name = 'InitHrSchema1700000001000';

    async up(queryRunner: QueryRunner): Promise<void> {
        // Extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // departments
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "code"        varchar(20) NOT NULL,
        "name"        varchar(255) NOT NULL,
        "parent_id"   uuid,
        "manager_id"  uuid,
        "is_active"   boolean     NOT NULL DEFAULT true,
        "tenant_id"   uuid        NOT NULL,
        "description" text,
        "created_at"  TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_dept_tenant" ON "departments" ("tenant_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dept_tenant_code" ON "departments" ("tenant_id", "code")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_dept_code" ON "departments" ("code")`);

        // positions
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "positions" (
        "id"            uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "code"          varchar(20)  NOT NULL,
        "title"         varchar(255) NOT NULL,
        "department_id" uuid         NOT NULL,
        "min_salary"    numeric(19,4) NOT NULL,
        "max_salary"    numeric(19,4) NOT NULL,
        "currency"      varchar(3)   NOT NULL,
        "is_active"     boolean      NOT NULL DEFAULT true,
        "tenant_id"     uuid         NOT NULL,
        "description"   text,
        "created_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_positions" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pos_tenant" ON "positions" ("tenant_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pos_tenant_code" ON "positions" ("tenant_id", "code")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pos_tenant_dept" ON "positions" ("tenant_id", "department_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pos_code" ON "positions" ("code")`);

        // employees
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id"               uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "employee_number"  varchar(30)  NOT NULL,
        "first_name"       varchar(100) NOT NULL,
        "last_name"        varchar(100) NOT NULL,
        "email"            varchar(255) NOT NULL,
        "phone"            varchar(30),
        "date_of_birth"    date         NOT NULL,
        "hire_date"        date         NOT NULL,
        "termination_date" date,
        "department_id"    uuid         NOT NULL,
        "position_id"      uuid         NOT NULL,
        "manager_id"       uuid,
        "status"           varchar(20)  NOT NULL,
        "base_salary"      numeric(19,4) NOT NULL,
        "currency"         varchar(3)   NOT NULL,
        "tenant_id"        uuid         NOT NULL,
        "created_by"       uuid         NOT NULL,
        "created_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employees" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emp_tenant" ON "employees" ("tenant_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_emp_tenant_number" ON "employees" ("tenant_id", "employee_number")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_emp_tenant_email" ON "employees" ("tenant_id", "email")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emp_tenant_status" ON "employees" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emp_tenant_dept" ON "employees" ("tenant_id", "department_id")`);

        // leave_requests
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id"               uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "employee_id"      uuid        NOT NULL,
        "leave_type"       varchar(20) NOT NULL,
        "start_date"       date        NOT NULL,
        "end_date"         date        NOT NULL,
        "total_days"       numeric(5,1) NOT NULL,
        "reason"           text,
        "status"           varchar(20) NOT NULL,
        "approved_by"      uuid,
        "rejection_reason" text,
        "tenant_id"        uuid        NOT NULL,
        "created_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_tenant" ON "leave_requests" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_tenant_emp" ON "leave_requests" ("tenant_id", "employee_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_tenant_status" ON "leave_requests" ("tenant_id", "status")`);

        // payroll_runs
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payroll_runs" (
        "id"               uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "run_number"       varchar(30)  NOT NULL,
        "period_year"      integer      NOT NULL,
        "period_month"     integer      NOT NULL,
        "status"           varchar(20)  NOT NULL,
        "total_gross"      numeric(19,4) NOT NULL,
        "total_deductions" numeric(19,4) NOT NULL,
        "total_net"        numeric(19,4) NOT NULL,
        "currency"         varchar(3)   NOT NULL,
        "tenant_id"        uuid         NOT NULL,
        "created_by"       uuid         NOT NULL,
        "processed_at"     TIMESTAMP WITH TIME ZONE,
        "created_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_runs" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pr_tenant" ON "payroll_runs" ("tenant_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pr_tenant_number" ON "payroll_runs" ("tenant_id", "run_number")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pr_tenant_period" ON "payroll_runs" ("tenant_id", "period_year", "period_month")`);

        // payroll_lines
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payroll_lines" (
        "id"             uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "payroll_run_id" uuid         NOT NULL,
        "employee_id"    uuid         NOT NULL,
        "base_salary"    numeric(19,4) NOT NULL,
        "allowances"     numeric(19,4) NOT NULL DEFAULT 0,
        "deductions"     numeric(19,4) NOT NULL DEFAULT 0,
        "tax_amount"     numeric(19,4) NOT NULL DEFAULT 0,
        "net_pay"        numeric(19,4) NOT NULL,
        "currency"       varchar(3)   NOT NULL,
        CONSTRAINT "PK_payroll_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payroll_lines_run" FOREIGN KEY ("payroll_run_id")
          REFERENCES "payroll_runs"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pl_run" ON "payroll_lines" ("payroll_run_id")`);

        // outbox_events
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id"           uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "event_id"     uuid         NOT NULL,
        "event_type"   varchar(100) NOT NULL,
        "aggregate_id" uuid         NOT NULL,
        "tenant_id"    uuid         NOT NULL,
        "payload"      jsonb        NOT NULL,
        "processed"    boolean      NOT NULL DEFAULT false,
        "created_at"   TIMESTAMP    NOT NULL DEFAULT now(),
        "processed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_outbox_tenant" ON "outbox_events" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_outbox_processed" ON "outbox_events" ("processed", "created_at")`);

        // processed_events
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_events" (
        "id"           uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "event_id"     uuid         NOT NULL,
        "event_type"   varchar(100) NOT NULL,
        "tenant_id"    uuid         NOT NULL,
        "processed_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_processed_events" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pe_tenant_event" ON "processed_events" ("tenant_id", "event_id")`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "processed_events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "outbox_events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payroll_lines"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payroll_runs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "positions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
    }
}
