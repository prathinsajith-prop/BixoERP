import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { UserOrmEntity } from './entity/user.orm-entity';
import { RoleOrmEntity } from './entity/role.orm-entity';
import { PermissionOrmEntity } from './entity/permission.orm-entity';
import { RefreshTokenOrmEntity } from './entity/refresh-token.orm-entity';
import { OutboxEventOrmEntity, ProcessedEventOrmEntity } from './entity/outbox.orm-entity';
import { OrganizationOrmEntity } from './entity/organization.orm-entity';
import { UserOrganizationOrmEntity } from './entity/user-organization.orm-entity';
import { DivisionOrmEntity } from './entity/division.orm-entity';
import { DepartmentOrmEntity } from './entity/department.orm-entity';
import { TeamOrmEntity } from './entity/team.orm-entity';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SALT_ROUNDS = 12;

// ── Sample Permissions ──────────────────────────────────────────────
const permissionsDef: { resource: string; action: string; description: string }[] = [
  // Auth
  { resource: 'auth:users', action: 'read', description: 'View users' },
  { resource: 'auth:users', action: 'write', description: 'Create/update users' },
  { resource: 'auth:users', action: 'delete', description: 'Delete users' },
  { resource: 'auth:roles', action: 'read', description: 'View roles' },
  { resource: 'auth:roles', action: 'write', description: 'Create/update roles' },
  { resource: 'auth:roles', action: 'delete', description: 'Delete roles' },
  { resource: 'auth:permissions', action: 'read', description: 'View permissions' },
  { resource: 'auth:permissions', action: 'write', description: 'Create/update permissions' },
  // Organizations
  { resource: 'auth:organizations', action: 'read', description: 'View organizations' },
  { resource: 'auth:organizations', action: 'write', description: 'Create/update organizations' },
  // Org Structure (Divisions, Departments, Teams)
  { resource: 'auth:org-structure', action: 'read', description: 'View org structure' },
  { resource: 'auth:org-structure', action: 'write', description: 'Create/update org structure' },
  { resource: 'auth:org-structure', action: 'delete', description: 'Delete org structure items' },
  // Finance
  { resource: 'finance:journal_entry', action: 'read', description: 'View journal entries' },
  { resource: 'finance:journal_entry', action: 'write', description: 'Create/update journal entries' },
  { resource: 'finance:journal_entry', action: 'approve', description: 'Approve journal entries' },
  { resource: 'finance:ledger', action: 'read', description: 'View general ledger' },
  { resource: 'finance:reports', action: 'read', description: 'View financial reports' },
  // HR
  { resource: 'hr:employees', action: 'read', description: 'View employees' },
  { resource: 'hr:employees', action: 'write', description: 'Create/update employees' },
  { resource: 'hr:payroll', action: 'read', description: 'View payroll' },
  { resource: 'hr:payroll', action: 'write', description: 'Process payroll' },
  { resource: 'hr:payroll', action: 'approve', description: 'Approve payroll' },
  // Sales
  { resource: 'sales:orders', action: 'read', description: 'View sales orders' },
  { resource: 'sales:orders', action: 'write', description: 'Create/update sales orders' },
  { resource: 'sales:orders', action: 'approve', description: 'Approve sales orders' },
  { resource: 'sales:customers', action: 'read', description: 'View customers' },
  { resource: 'sales:customers', action: 'write', description: 'Create/update customers' },
  // Inventory
  { resource: 'inventory:items', action: 'read', description: 'View inventory items' },
  { resource: 'inventory:items', action: 'write', description: 'Create/update inventory items' },
  { resource: 'inventory:stock', action: 'read', description: 'View stock levels' },
  { resource: 'inventory:stock', action: 'write', description: 'Adjust stock' },
  // Procurement
  { resource: 'procurement:purchase_orders', action: 'read', description: 'View purchase orders' },
  { resource: 'procurement:purchase_orders', action: 'write', description: 'Create/update purchase orders' },
  { resource: 'procurement:purchase_orders', action: 'approve', description: 'Approve purchase orders' },
  { resource: 'procurement:vendors', action: 'read', description: 'View vendors' },
  { resource: 'procurement:vendors', action: 'write', description: 'Create/update vendors' },
  // Manufacturing
  { resource: 'manufacturing:work_orders', action: 'read', description: 'View work orders' },
  { resource: 'manufacturing:work_orders', action: 'write', description: 'Create/update work orders' },
  { resource: 'manufacturing:bom', action: 'read', description: 'View bill of materials' },
  { resource: 'manufacturing:bom', action: 'write', description: 'Create/update bill of materials' },
];

// ── Sample Users ────────────────────────────────────────────────────
const usersDef = [
  { email: 'admin@erp.com', password: 'Admin@123', firstName: 'System', lastName: 'Admin', status: 'ACTIVE' },
  { email: 'finance@erp.com', password: 'Finance@123', firstName: 'Alice', lastName: 'Finance', status: 'ACTIVE' },
  { email: 'hr@erp.com', password: 'HrUser@123', firstName: 'Bob', lastName: 'Human Resources', status: 'ACTIVE' },
  { email: 'sales@erp.com', password: 'Sales@123', firstName: 'Charlie', lastName: 'Sales', status: 'ACTIVE' },
];

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'georgejohn',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'auth_db',
    entities: [
      UserOrmEntity, RoleOrmEntity, PermissionOrmEntity,
      RefreshTokenOrmEntity, OutboxEventOrmEntity, ProcessedEventOrmEntity,
      OrganizationOrmEntity, UserOrganizationOrmEntity,
      DivisionOrmEntity, DepartmentOrmEntity, TeamOrmEntity,
    ],
    synchronize: true,
  });

  await ds.initialize();
  console.log('Connected to database');

  const permRepo = ds.getRepository(PermissionOrmEntity);
  const roleRepo = ds.getRepository(RoleOrmEntity);
  const userRepo = ds.getRepository(UserOrmEntity);

  // ── 1. Seed Permissions ─────────────────────────────────────────
  const permissionIds: Record<string, string> = {};

  for (const p of permissionsDef) {
    const existing = await permRepo.findOne({
      where: { tenant_id: TENANT_ID, resource: p.resource, action: p.action },
    });
    if (existing) {
      permissionIds[`${p.resource}:${p.action}`] = existing.id;
      console.log(`  Permission exists: ${p.resource}:${p.action}`);
    } else {
      const entity = permRepo.create({
        id: randomUUID(),
        tenant_id: TENANT_ID,
        resource: p.resource,
        action: p.action,
        description: p.description,
      });
      const saved = await permRepo.save(entity);
      permissionIds[`${p.resource}:${p.action}`] = saved.id;
      console.log(`  Created permission: ${p.resource}:${p.action}`);
    }
  }

  const allPermIds = Object.values(permissionIds);

  // ── 2. Seed Roles ───────────────────────────────────────────────
  const financePerms = allPermIds.filter((_, i) => {
    const key = Object.keys(permissionIds)[i];
    return key.startsWith('finance:') || key.startsWith('auth:');
  });
  const hrPerms = allPermIds.filter((_, i) => {
    const key = Object.keys(permissionIds)[i];
    return key.startsWith('hr:') || key.startsWith('auth:users:read') || key.startsWith('auth:roles:read');
  });
  const salesPerms = allPermIds.filter((_, i) => {
    const key = Object.keys(permissionIds)[i];
    return key.startsWith('sales:') || key.startsWith('inventory:items:read') || key.startsWith('inventory:stock:read');
  });

  const rolesDef = [
    { name: 'Super Admin', description: 'Full system access', isSystem: true, permissions: allPermIds },
    { name: 'Finance Manager', description: 'Manage finance operations', isSystem: false, permissions: financePerms },
    { name: 'HR Manager', description: 'Manage HR and payroll', isSystem: false, permissions: hrPerms },
    { name: 'Sales Representative', description: 'Manage sales and customers', isSystem: false, permissions: salesPerms },
  ];

  const roleIds: Record<string, string> = {};

  for (const r of rolesDef) {
    const existing = await roleRepo.findOne({
      where: { tenant_id: TENANT_ID, name: r.name },
    });
    if (existing) {
      roleIds[r.name] = existing.id;
      console.log(`  Role exists: ${r.name}`);
    } else {
      const entity = roleRepo.create({
        id: randomUUID(),
        tenant_id: TENANT_ID,
        name: r.name,
        description: r.description,
        is_system: r.isSystem,
        permissions: r.permissions,
      });
      const saved = await roleRepo.save(entity);
      roleIds[r.name] = saved.id;
      console.log(`  Created role: ${r.name}`);
    }
  }

  // ── 3. Seed Users ───────────────────────────────────────────────
  const userRoleMap: Record<string, string[]> = {
    'admin@erp.com': [roleIds['Super Admin']],
    'finance@erp.com': [roleIds['Finance Manager']],
    'hr@erp.com': [roleIds['HR Manager']],
    'sales@erp.com': [roleIds['Sales Representative']],
  };

  for (const u of usersDef) {
    const existing = await userRepo.findOne({
      where: { tenant_id: TENANT_ID, email: u.email },
    });
    if (existing) {
      console.log(`  User exists: ${u.email}`);
    } else {
      const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
      const now = new Date();
      const entity = userRepo.create({
        id: randomUUID(),
        tenant_id: TENANT_ID,
        email: u.email,
        hashed_password: hashedPassword,
        first_name: u.firstName,
        last_name: u.lastName,
        status: u.status,
        roles: userRoleMap[u.email] ?? [],
        failed_login_attempts: 0,
        password_changed_at: now,
      });
      await userRepo.save(entity);
      console.log(`  Created user: ${u.email}`);
    }
  }

  // ── 4. Seed Default Organization & Memberships ─────────────────
  const orgRepo = ds.getRepository(OrganizationOrmEntity);
  const userOrgRepo = ds.getRepository(UserOrganizationOrmEntity);

  let defaultOrg = await orgRepo.findOne({ where: { id: TENANT_ID } });
  if (!defaultOrg) {
    defaultOrg = orgRepo.create({
      id: TENANT_ID,
      name: 'Default Organization',
      slug: 'default-org',
      description: 'Default ERP organization',
      status: 'ACTIVE',
      owner_id: TENANT_ID, // will be updated below
    });
  }

  // Get admin user id to set as owner
  const adminUser = await userRepo.findOne({ where: { tenant_id: TENANT_ID, email: 'admin@erp.com' } });
  if (adminUser) {
    defaultOrg.owner_id = adminUser.id;
  }
  await orgRepo.save(defaultOrg);
  console.log('  Default organization seeded');

  // Link all seeded users to the default organization
  const allUsers = await userRepo.find({ where: { tenant_id: TENANT_ID } });
  for (const u of allUsers) {
    const existing = await userOrgRepo.findOne({
      where: { user_id: u.id, organization_id: TENANT_ID },
    });
    if (!existing) {
      const membership = userOrgRepo.create({
        id: randomUUID(),
        user_id: u.id,
        organization_id: TENANT_ID,
        role: u.email === 'admin@erp.com' ? 'OWNER' : 'MEMBER',
      });
      await userOrgRepo.save(membership);
      console.log(`  Linked ${u.email} to default org`);
    } else {
      console.log(`  ${u.email} already linked to default org`);
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('\nSample credentials:');
  console.log('  admin@erp.com   / Admin@123   (Super Admin)');
  console.log('  finance@erp.com / Finance@123 (Finance Manager)');
  console.log('  hr@erp.com      / HrUser@123  (HR Manager)');
  console.log('  sales@erp.com   / Sales@123   (Sales Representative)');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
