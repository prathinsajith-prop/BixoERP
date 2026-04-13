import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Headers,
    UseGuards,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
    BadRequestException,
    OnModuleInit,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guard/permissions.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { OrgModuleConfigOrmEntity } from '../../infrastructure/persistence/entity/org-module-config.orm-entity';
import { PermissionOrmEntity } from '../../infrastructure/persistence/entity/permission.orm-entity';
import { RoleOrmEntity } from '../../infrastructure/persistence/entity/role.orm-entity';
import { MODULE_CATALOG, MANIFEST_BY_ID } from '../../manifests/catalog';
import { OrgDefaultSeedingService } from '../../application/service/org-default-seeding.service';

@Controller('api/v1/auth/modules')
export class ModuleConfigController implements OnModuleInit {
    private readonly logger = new Logger(ModuleConfigController.name);

    constructor(
        @InjectRepository(OrgModuleConfigOrmEntity)
        private readonly moduleRepo: Repository<OrgModuleConfigOrmEntity>,
        @InjectRepository(PermissionOrmEntity)
        private readonly permissionRepo: Repository<PermissionOrmEntity>,
        @InjectRepository(RoleOrmEntity)
        private readonly roleRepo: Repository<RoleOrmEntity>,
        private readonly defaultSeedingService: OrgDefaultSeedingService,
    ) { }

    // ─── Startup: seed all modules for all orgs ───────────────────────
    async onModuleInit(): Promise<void> {
        try {
            const orgs = await this.moduleRepo.query(
                `SELECT id FROM organizations WHERE deleted_at IS NULL`,
            ) as { id: string }[];

            if (orgs.length === 0) {
                this.logger.warn('No organisations found during module catalog seed — will seed on next restart after orgs are created.');
                return;
            }

            let seeded = 0;
            for (const org of orgs) {
                // Backfill core/auth default permissions and roles for orgs that may
                // have been created before this seeding logic was introduced.
                await this.defaultSeedingService.seedForOrg(org.id);

                for (const entry of MODULE_CATALOG) {
                    await this.moduleRepo.query(
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
                            org.id,
                            entry.moduleId,
                            entry.moduleKey,
                            entry.tier,
                            entry.manifestVersion,
                            JSON.stringify(entry.manifest),
                        ],
                    );
                    seeded++;
                }
            }
            this.logger.log(`Module catalog seeded: ${seeded} rows across ${orgs.length} org(s).`);

            // Also seed module_registry so the admin page shows all modules even
            // before the individual module services have called /register.
            // ON CONFLICT DO NOTHING ensures live service registrations are never overwritten.
            let registrySeeded = 0;
            for (const entry of MODULE_CATALOG) {
                if (!entry.manifest) continue;
                const hash = crypto.createHash('sha256').update(JSON.stringify(entry.manifest)).digest('hex');
                const modInfo = entry.manifest['module'] as Record<string, string> | undefined;
                const moduleName = modInfo?.['name'] ?? entry.moduleKey;
                await this.moduleRepo.query(
                    `INSERT INTO module_registry
                       (id, module_id, module_key, module_name, current_version, previous_version, manifest, manifest_hash, tier)
                     VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, $5::jsonb, $6, $7)
                     ON CONFLICT (module_id) DO NOTHING`,
                    [entry.moduleId, entry.moduleKey, moduleName, entry.manifestVersion, JSON.stringify(entry.manifest), hash, entry.tier],
                );
                registrySeeded++;
            }
            this.logger.log(`Module registry pre-seeded: ${registrySeeded} entries (skipping existing).`);
        } catch (err) {
            // Never crash the service over seeding failure
            this.logger.error('Module catalog seed failed:', err);
        }
    }

    // ─── GET /api/v1/auth/modules ─────────────────────────────────────
    @Get()
    @UseGuards(JwtAuthGuard)
    async listModuleConfigs(@TenantId() orgId: string) {
        const configs = await this.moduleRepo.find({
            where: { orgId },
            order: { moduleKey: 'ASC' },
        });
        return {
            statusCode: 200,
            data: configs.map(this.toResponse),
        };
    }

    // ─── POST /api/v1/auth/modules/register ───────────────────────────
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async registerModule(
        @Headers('x-internal-secret') secret: string,
        @Body() manifest: Record<string, unknown>,
    ) {
        const expected = process.env.INTERNAL_API_SECRET;
        if (!expected || secret !== expected) {
            throw new UnauthorizedException('Invalid internal secret');
        }

        const mod = manifest['module'] as Record<string, string> | undefined;
        if (!mod?.id) throw new BadRequestException('manifest.module.id is required');

        const moduleId = mod.id;
        const moduleKey = this.deriveModuleKey(moduleId);
        const tier = (manifest['tier'] as string) ?? null;
        const manifestVersion = (mod['version'] as string) ?? null;

        // Upsert a row for each existing org — update manifest_data so the
        // live manifest (from the running frontend) replaces the bundled copy.
        const orgs = await this.moduleRepo.query(
            `SELECT id FROM organizations WHERE deleted_at IS NULL`,
        ) as { id: string }[];

        for (const org of orgs) {
            await this.moduleRepo.query(
                `INSERT INTO org_module_configs
                   (id, org_id, module_id, module_key, enabled, tier, manifest_version, manifest_data)
                 VALUES ($1, $2, $3, $4, false, $5, $6, $7::jsonb)
                 ON CONFLICT (org_id, module_id) DO UPDATE
                   SET manifest_version = EXCLUDED.manifest_version,
                       tier             = EXCLUDED.tier,
                       module_key       = EXCLUDED.module_key,
                       manifest_data    = EXCLUDED.manifest_data,
                       updated_at       = NOW()`,
                [uuidv4(), org.id, moduleId, moduleKey, tier, manifestVersion, JSON.stringify(manifest)],
            );
        }

        return {
            statusCode: 201,
            data: { moduleId, registered: true },
        };
    }

    // ─── GET /api/v1/auth/modules/:moduleId ───────────────────────────
    @Get(':moduleId')
    @UseGuards(JwtAuthGuard)
    async getModuleConfig(
        @TenantId() orgId: string,
        @Param('moduleId') moduleId: string,
    ) {
        const config = await this.moduleRepo.findOne({ where: { orgId, moduleId } });
        if (!config) throw new NotFoundException('Module config not found');
        return { statusCode: 200, data: this.toResponse(config) };
    }

    // ─── PATCH /api/v1/auth/modules/:moduleId ─────────────────────────
    @Patch(':moduleId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:write')
    async toggleModule(
        @TenantId() orgId: string,
        @CurrentUser() user: { sub: string },
        @Param('moduleId') moduleId: string,
        @Body() body: { enabled: boolean; settings?: Record<string, unknown> },
    ) {
        let config = await this.moduleRepo.findOne({ where: { orgId, moduleId } });

        if (!config) {
            // Create a stub — module may not have registered yet
            config = this.moduleRepo.create({
                id: uuidv4(),
                orgId,
                moduleId,
                moduleKey: this.deriveModuleKey(moduleId),
                enabled: false,
                settings: {},
            });
            await this.moduleRepo.save(config);
        }

        const enabling = body.enabled;

        if (!enabling) {
            // Disabling: check if other enabled modules depend on this one
            const allConfigs = await this.moduleRepo.find({ where: { orgId, enabled: true } });
            const conflicting: string[] = [];

            for (const other of allConfigs) {
                if (other.moduleId === moduleId) continue;
                const manifest = this.resolveManifest(other);
                if (!manifest) continue;
                const deps: { module: string; optional?: boolean }[] =
                    (manifest['compatibility'] as any)?.dependencies ?? [];
                if (deps.some((d) => !d.optional && d.module === moduleId)) {
                    conflicting.push(other.moduleId);
                }
            }

            if (conflicting.length > 0) {
                throw new ConflictException({ message: 'Other modules depend on this one', conflictingModules: conflicting });
            }

            config.enabled = false;
            config.deactivatedAt = new Date();
            if (body.settings) config.settings = body.settings;
            await this.moduleRepo.save(config);

            return { statusCode: 200, data: this.toResponse(config) };
        }

        // Enabling: seed permissions + roles from manifest
        const manifest = this.resolveManifest(config);
        if (manifest) {
            await this.seedPermissions(orgId, manifest);
            await this.seedRoles(orgId, manifest);
        }

        config.enabled = true;
        config.activatedAt = new Date();
        config.activatedBy = user.sub;
        config.deactivatedAt = null;
        if (body.settings) config.settings = body.settings;
        await this.moduleRepo.save(config);

        // Emit custom event for sidebar refresh (handled via the response)
        return {
            statusCode: 200,
            data: {
                ...this.toResponse(config),
                moduleConfigChanged: true,
            },
        };
    }

    // ─── GET /api/v1/auth/modules/:moduleId/manifest ──────────────────
    @Get(':moduleId/manifest')
    @UseGuards(JwtAuthGuard)
    async getModuleManifest(
        @TenantId() orgId: string,
        @Param('moduleId') moduleId: string,
    ) {
        const config = await this.moduleRepo.findOne({ where: { orgId, moduleId } });
        if (!config) throw new NotFoundException('Module not registered');

        const manifest = this.resolveManifest(config);
        if (!manifest) throw new NotFoundException(`Manifest not available for: ${moduleId}`);
        return { statusCode: 200, data: manifest };
    }

    // ─── Private helpers ──────────────────────────────────────────────

    private toResponse(c: OrgModuleConfigOrmEntity) {
        return {
            id: c.id,
            moduleId: c.moduleId,
            moduleKey: c.moduleKey,
            enabled: c.enabled,
            tier: c.tier,
            manifestVersion: c.manifestVersion,
            settings: c.settings,
            activatedAt: c.activatedAt?.toISOString() ?? null,
            activatedBy: c.activatedBy ?? null,
        };
    }

    private deriveModuleKey(moduleId: string): string {
        // "hr_module" → "hr",  "finance_module" → "finance"
        return moduleId.replace(/_module$/, '').replace(/_svc$/, '');
    }

    /**
     * Returns the manifest for a module config.
     * Priority: DB manifest_data (live/registered) → embedded catalog (bundled with backend).
     */
    private resolveManifest(config: OrgModuleConfigOrmEntity): Record<string, unknown> | null {
        if (config.manifestData && Object.keys(config.manifestData).length > 0) {
            return config.manifestData;
        }
        return MANIFEST_BY_ID[config.moduleId]?.manifest ?? MANIFEST_BY_ID[config.moduleKey]?.manifest ?? null;
    }

    private async seedPermissions(orgId: string, manifest: Record<string, unknown>): Promise<void> {
        const groups = (manifest['permissions'] as any[]) ?? [];
        for (const group of groups) {
            const resource: string = group.resource ?? '';
            const actions: { id: string; description?: string }[] = group.actions ?? [];
            for (const action of actions) {
                const code = action.id; // e.g. "hr:employee.read"
                const parts = code.split(':');
                const actionStr = parts[1] ?? code; // "employee.read"

                await this.permissionRepo.query(
                    `INSERT INTO permissions (id, tenant_id, resource, action, scope, description, code)
           VALUES ($1, $2, $3, $4, 'organisation', $5, $6)
           ON CONFLICT (tenant_id, resource, action, scope) DO UPDATE
             SET code = EXCLUDED.code,
                 description = EXCLUDED.description,
                 updated_at = NOW()`,
                    [uuidv4(), orgId, resource, actionStr, action.description ?? '', code],
                );
            }
        }
    }

    private async seedRoles(orgId: string, manifest: Record<string, unknown>): Promise<void> {
        const roles = (manifest['roles'] as any[]) ?? [];
        const permissions = await this.permissionRepo.find({ where: { tenant_id: orgId } });
        const permByCode: Record<string, string> = {};
        permissions.forEach((p) => { if (p.code) permByCode[p.code] = p.id; });

        for (const role of roles) {
            const code: string = role.id; // e.g. "hr_admin"

            // Check if already exists by code
            const existing = await this.roleRepo.query(
                `SELECT id FROM roles WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL LIMIT 1`,
                [orgId, code],
            ) as { id: string }[];
            if (existing.length > 0) continue;

            const scopes: string[] = role.scopes ?? [];
            const permIds = scopes
                .map((s: string) => {
                    if (s.endsWith(':*') || s.endsWith('.*')) {
                        // Wildcard — include all permissions with matching prefix
                        const prefix = s.replace('.*', ':').replace(':*', ':');
                        return permissions.filter((p) => ((p as any).code ?? '').startsWith(prefix)).map((p) => p.id);
                    }
                    return permByCode[s] ? [permByCode[s]] : [];
                })
                .flat();

            await this.roleRepo.query(
                `INSERT INTO roles (id, tenant_id, name, description, permissions, is_system, code)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         ON CONFLICT (tenant_id, code) DO NOTHING`,
                [
                    uuidv4(),
                    orgId,
                    role.name,
                    role.description ?? '',
                    `{${[...new Set(permIds)].join(',')}}`,
                    code,
                ],
            );
        }
    }
}
