import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PermissionOrmEntity } from '../../infrastructure/persistence/entity/permission.orm-entity';
import { RoleOrmEntity } from '../../infrastructure/persistence/entity/role.orm-entity';
import { OrgModuleConfigOrmEntity } from '../../infrastructure/persistence/entity/org-module-config.orm-entity';
import { MODULE_CATALOG } from '../../manifests/catalog';

// ─── Core / Auth default permissions ─────────────────────────────────────────
// These are seeded into every new org regardless of which modules are enabled.
// They cover basic org management, user management, roles & permissions, and
// org-structure management which are always required by the core service.

interface DefaultPermission {
    code: string;       // e.g. "auth:organizations:read"
    resource: string;   // e.g. "organizations"
    action: string;     // e.g. "read"
    description: string;
}

interface DefaultRole {
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissionCodes: string[];
}

const DEFAULT_PERMISSIONS: DefaultPermission[] = [
    // Organizations
    { code: 'auth:organizations:read', resource: 'organizations', action: 'read', description: 'View organizations' },
    { code: 'auth:organizations:write', resource: 'organizations', action: 'write', description: 'Create and update organizations' },

    // Users
    { code: 'auth:users:read', resource: 'users', action: 'read', description: 'View org members' },
    { code: 'auth:users:write', resource: 'users', action: 'write', description: 'Invite and update org members' },
    { code: 'auth:users:delete', resource: 'users', action: 'delete', description: 'Remove org members' },

    // Roles
    { code: 'auth:roles:read', resource: 'roles', action: 'read', description: 'View roles' },
    { code: 'auth:roles:write', resource: 'roles', action: 'write', description: 'Create and update roles' },
    { code: 'auth:roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },

    // Permissions
    { code: 'auth:permissions:read', resource: 'permissions', action: 'read', description: 'View permissions' },
    { code: 'auth:permissions:write', resource: 'permissions', action: 'write', description: 'Create and update permissions' },
    { code: 'auth:permissions:delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' },

    // Org structure
    { code: 'auth:org-structure:read', resource: 'org-structure', action: 'read', description: 'View departments, divisions, and teams' },
    { code: 'auth:org-structure:write', resource: 'org-structure', action: 'write', description: 'Manage departments, divisions, and teams' },
    { code: 'auth:org-structure:delete', resource: 'org-structure', action: 'delete', description: 'Delete departments, divisions, and teams' },

    // Modules
    { code: 'auth:modules:read', resource: 'modules', action: 'read', description: 'View module configurations' },
    { code: 'auth:modules:write', resource: 'modules', action: 'write', description: 'Enable and configure modules' },
];

const DEFAULT_ROLES: DefaultRole[] = [
    {
        code: 'org_admin',
        name: 'Organization Administrator',
        description: 'Full access to all organization management features',
        isSystem: true,
        permissionCodes: DEFAULT_PERMISSIONS.map((p) => p.code),
    },
    {
        code: 'org_manager',
        name: 'Organization Manager',
        description: 'Manage members and org structure, view roles and permissions',
        isSystem: true,
        permissionCodes: [
            'auth:organizations:read',
            'auth:users:read',
            'auth:users:write',
            'auth:roles:read',
            'auth:permissions:read',
            'auth:org-structure:read',
            'auth:org-structure:write',
            'auth:modules:read',
        ],
    },
    {
        code: 'org_member',
        name: 'Organization Member',
        description: 'Basic read access to org data',
        isSystem: true,
        permissionCodes: [
            'auth:organizations:read',
            'auth:users:read',
            'auth:roles:read',
            'auth:org-structure:read',
            'auth:modules:read',
        ],
    },
];

type DefaultModulePreset = 'none' | 'starter' | 'standard' | 'full';

const DEFAULT_MODULE_PRESETS: Record<Exclude<DefaultModulePreset, 'none' | 'full'>, string[]> = {
    starter: [
        'workflow_module',
        'notifications_module',
        'files_module',
        'audit_module',
    ],
    standard: [
        'workflow_module',
        'notifications_module',
        'files_module',
        'audit_module',
        'finance_module',
        'apar_module',
        'hr_module',
        'reports_module',
    ],
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class OrgDefaultSeedingService {
    private readonly logger = new Logger(OrgDefaultSeedingService.name);

    constructor(
        @InjectRepository(PermissionOrmEntity)
        private readonly permissionRepo: Repository<PermissionOrmEntity>,
        @InjectRepository(RoleOrmEntity)
        private readonly roleRepo: Repository<RoleOrmEntity>,
        @InjectRepository(OrgModuleConfigOrmEntity)
        private readonly orgModuleRepo: Repository<OrgModuleConfigOrmEntity>,
    ) { }

    /**
     * Seeds the default core/auth permissions and roles into an org.
     * Safe to call multiple times — all INSERTs use ON CONFLICT DO NOTHING / DO UPDATE.
     */
    async seedForOrg(orgId: string, actorId?: string): Promise<void> {
        try {
            await this.seedPermissions(orgId);
            await this.seedRoles(orgId);
            await this.seedModuleCatalog(orgId);
            await this.applyDefaultModulePreset(orgId, actorId);
            this.logger.log(`Default permissions, roles, and module configs seeded for org ${orgId}`);
        } catch (err) {
            // Never crash org creation over seeding failure — log and continue
            this.logger.error(`Failed to seed defaults for org ${orgId}:`, err);
        }
    }

    private async seedModuleCatalog(orgId: string): Promise<void> {
        let seeded = 0;
        for (const entry of MODULE_CATALOG) {
            await this.orgModuleRepo.query(
                `INSERT INTO org_module_configs
                   (id, org_id, module_id, module_key, enabled, tier, manifest_version, manifest_data)
                 VALUES ($1, $2, $3, $4, false, $5, $6, $7::jsonb)
                 ON CONFLICT (org_id, module_id) DO UPDATE
                   SET module_key       = EXCLUDED.module_key,
                       tier             = EXCLUDED.tier,
                       manifest_version = EXCLUDED.manifest_version,
                       manifest_data    = EXCLUDED.manifest_data,
                       updated_at       = NOW()`,
                [
                    uuidv4(),
                    orgId,
                    entry.moduleId,
                    entry.moduleKey,
                    entry.tier,
                    entry.manifestVersion,
                    JSON.stringify(entry.manifest),
                ],
            );
            seeded++;
        }
        this.logger.log(`Module catalog seeded for org ${orgId}: ${seeded} modules.`);
    }

    private async applyDefaultModulePreset(orgId: string, actorId?: string): Promise<void> {
        const configured = (process.env.ORG_DEFAULT_MODULE_PRESET ?? 'starter').toLowerCase() as DefaultModulePreset;
        const preset: DefaultModulePreset = ['none', 'starter', 'standard', 'full'].includes(configured) ? configured : 'starter';

        if (preset === 'none') {
            this.logger.log(`Default module preset skipped for org ${orgId} (ORG_DEFAULT_MODULE_PRESET=none).`);
            return;
        }

        const moduleIds = preset === 'full'
            ? MODULE_CATALOG.map((m) => m.moduleId)
            : DEFAULT_MODULE_PRESETS[preset as 'starter' | 'standard'];

        if (moduleIds.length === 0) return;

        await this.orgModuleRepo.query(
            `UPDATE org_module_configs
             SET enabled = true,
                 adopted_version = COALESCE(adopted_version, manifest_version),
                 pending_version = NULL,
                 activated_at = COALESCE(activated_at, NOW()),
                 activated_by = COALESCE(activated_by, $3::uuid),
                 deactivated_at = NULL,
                 updated_at = NOW()
             WHERE org_id = $1 AND module_id = ANY($2::text[])`,
            [orgId, moduleIds, actorId ?? null],
        );

        this.logger.log(`Default module preset applied for org ${orgId}: ${preset} (${moduleIds.length} modules).`);
    }

    private async seedPermissions(orgId: string): Promise<void> {
        for (const p of DEFAULT_PERMISSIONS) {
            await this.permissionRepo.query(
                `INSERT INTO permissions (id, tenant_id, resource, action, scope, description, code)
         VALUES ($1, $2, $3, $4, 'organisation', $5, $6)
         ON CONFLICT (tenant_id, resource, action, scope) DO UPDATE
           SET code        = EXCLUDED.code,
               description = EXCLUDED.description,
               updated_at  = NOW()`,
                [uuidv4(), orgId, p.resource, p.action, p.description, p.code],
            );
        }
    }

    private async seedRoles(orgId: string): Promise<void> {
        // Build a code→id map from freshly seeded permissions
        const perms = await this.permissionRepo.find({ where: { tenant_id: orgId } });
        const permByCode: Record<string, string> = {};
        perms.forEach((p) => { if (p.code) permByCode[p.code] = p.id; });

        for (const role of DEFAULT_ROLES) {
            const permIds = role.permissionCodes
                .map((c) => permByCode[c])
                .filter(Boolean);

            await this.roleRepo.query(
                `INSERT INTO roles (id, tenant_id, name, description, permissions, is_system, code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, code) DO NOTHING`,
                [
                    uuidv4(),
                    orgId,
                    role.name,
                    role.description,
                    `{${[...new Set(permIds)].join(',')}}`,
                    role.isSystem,
                    role.code,
                ],
            );
        }
    }
}
