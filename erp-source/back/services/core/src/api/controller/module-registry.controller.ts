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
    Logger,
    Request,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guard/permissions.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { ModuleRegistryOrmEntity } from '../../infrastructure/persistence/entity/module-registry.orm-entity';
import { OrgModuleConfigOrmEntity } from '../../infrastructure/persistence/entity/org-module-config.orm-entity';
import { PermissionOrmEntity } from '../../infrastructure/persistence/entity/permission.orm-entity';

// ── Preset definitions ───────────────────────────────────────────────
const PRESETS: Record<string, string[]> = {
    starter: ['workflow_module', 'notifications_module', 'files_module', 'audit_module'],
    standard: ['workflow_module', 'notifications_module', 'files_module', 'audit_module',
        'finance_module', 'apar_module', 'hr_module', 'reports_module'],
    full: [], // populated at runtime = all registered modules
};

@Controller('api/v1/auth/modules')
export class ModuleRegistryController {
    private readonly logger = new Logger(ModuleRegistryController.name);

    constructor(
        @InjectRepository(ModuleRegistryOrmEntity)
        private readonly registryRepo: Repository<ModuleRegistryOrmEntity>,
        @InjectRepository(OrgModuleConfigOrmEntity)
        private readonly configRepo: Repository<OrgModuleConfigOrmEntity>,
        @InjectRepository(PermissionOrmEntity)
        private readonly permissionRepo: Repository<PermissionOrmEntity>,
    ) { }

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
        const moduleKey = moduleId.replace(/_module$/, '');
        const moduleName = (mod['name'] as string) ?? moduleKey;
        const version = (mod['version'] as string) ?? '1.0.0';
        const tier = (manifest['tier'] as string) ?? 'standard';
        const hash = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');

        const existing = await this.registryRepo.findOne({ where: { moduleId } });
        let isNew = false;
        let isUpdated = false;

        if (!existing) {
            // New module — insert into registry
            await this.registryRepo.save(this.registryRepo.create({
                id: uuidv4(),
                moduleId,
                moduleKey,
                moduleName,
                currentVersion: version,
                previousVersion: null,
                manifest,
                manifestHash: hash,
                tier,
            }));
            isNew = true;
            this.logger.log(`Module registered: ${moduleId} v${version}`);
        } else if (existing.manifestHash !== hash) {
            // Version changed — update registry and mark pending for all adopting orgs
            const previousVersion = existing.currentVersion;
            await this.registryRepo.query(
                `UPDATE module_registry
                 SET previous_version = $1, current_version = $2, manifest = $3::jsonb,
                     manifest_hash = $4, module_name = $5, tier = $6, updated_at = NOW()
                 WHERE id = $7`,
                [previousVersion, version, JSON.stringify(manifest), hash, moduleName, tier, existing.id],
            );

            // Mark pending_version on all orgs that have adopted this module
            await this.configRepo.query(
                `UPDATE org_module_configs
                 SET pending_version = $1, updated_at = NOW()
                 WHERE module_id = $2 AND adopted_version IS NOT NULL`,
                [version, moduleId],
            );
            isUpdated = true;
            this.logger.log(`Module updated: ${moduleId} v${previousVersion} → v${version}`);
        } else {
            this.logger.debug(`Module already up to date: ${moduleId} v${version}`);
        }

        // Bulk upsert org_module_configs for all existing orgs in a single query
        await this.configRepo.query(
            `INSERT INTO org_module_configs
               (id, org_id, module_id, module_key, enabled, tier, manifest_version, manifest_data)
             SELECT gen_random_uuid(), id, $1, $2, false, $3, $4, $5::jsonb
             FROM organizations
             WHERE deleted_at IS NULL
             ON CONFLICT (org_id, module_id) DO UPDATE
               SET manifest_version = EXCLUDED.manifest_version,
                   tier             = EXCLUDED.tier,
                   module_key       = EXCLUDED.module_key,
                   manifest_data    = EXCLUDED.manifest_data,
                   updated_at       = NOW()`,
            [moduleId, moduleKey, tier, version, JSON.stringify(manifest)],
        );

        return { statusCode: 201, data: { moduleId, version, isNew, isUpdated } };
    }

    // ─── GET /api/v1/auth/modules/registry ────────────────────────────
    @Get('registry')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:read')
    async listRegistry() {
        const modules = await this.registryRepo.find({ order: { moduleKey: 'ASC' } });
        return {
            statusCode: 200,
            data: modules.map(m => ({
                moduleId: m.moduleId,
                moduleKey: m.moduleKey,
                moduleName: m.moduleName,
                currentVersion: m.currentVersion,
                previousVersion: m.previousVersion,
                tier: m.tier,
                manifest: m.manifest,
                registeredAt: m.registeredAt,
                updatedAt: m.updatedAt,
            })),
        };
    }

    // ─── GET /api/v1/auth/modules/org/current ─────────────────────────
    @Get('org/current')
    @UseGuards(JwtAuthGuard)
    async getCurrentOrgModules(@TenantId() orgId: string) {
        return this.buildOrgModuleResponse(orgId);
    }

    // ─── GET /api/v1/auth/modules/org/current/feature-flags/:moduleId ─
    @Get('org/current/feature-flags/:moduleId')
    @UseGuards(JwtAuthGuard)
    async getCurrentOrgFeatureFlags(
        @TenantId() orgId: string,
        @Param('moduleId') moduleId: string,
    ) {
        const config = await this.configRepo.findOne({ where: { orgId, moduleId } });
        return {
            statusCode: 200,
            data: { featureFlags: config?.featureFlags ?? {} },
        };
    }

    // ─── GET /api/v1/auth/modules/org/:orgId ──────────────────────────
    @Get('org/:orgId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:read')
    async getOrgModules(@Param('orgId') orgId: string) {
        return this.buildOrgModuleResponse(orgId);
    }

    // ─── GET /api/v1/auth/modules/org/:orgId/summary ──────────────────
    @Get('org/:orgId/summary')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:read')
    async getOrgModuleSummary(@Param('orgId') orgId: string) {
        const configs = await this.configRepo.find({ where: { orgId } });
        const enabled = configs.filter(c => c.enabled);
        const pendingUpdates = configs.filter(
            c => c.pendingVersion && c.pendingVersion !== c.adoptedVersion,
        );
        return {
            statusCode: 200,
            data: {
                totalModules: configs.length,
                enabledModules: enabled.length,
                pendingUpdates: pendingUpdates.length,
                enabledKeys: enabled.map(c => c.moduleKey),
            },
        };
    }

    // ─── PATCH /api/v1/auth/modules/org/:orgId/:moduleId ──────────────
    @Patch('org/:orgId/:moduleId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:write')
    async updateOrgModule(
        @Param('orgId') orgId: string,
        @Param('moduleId') moduleId: string,
        @CurrentUser() user: { sub: string },
        @Body() body: {
            enabled?: boolean;
            featureFlags?: Record<string, boolean>;
            notes?: string;
            adoptVersion?: boolean;
            menuOverride?: unknown[] | null;
        },
    ) {
        // Find or create the config row
        let config = await this.configRepo.findOne({ where: { orgId, moduleId } });
        if (!config) {
            const reg = await this.registryRepo.findOne({ where: { moduleId } });
            config = this.configRepo.create({
                id: uuidv4(),
                orgId,
                moduleId,
                moduleKey: reg?.moduleKey ?? moduleId.replace(/_module$/, ''),
                enabled: false,
                settings: {},
                featureFlags: {},
            });
            await this.configRepo.save(config);
        }

        const registryEntry = await this.registryRepo.findOne({ where: { moduleId } });

        // ── A. Enable/disable ──────────────────────────────────────────
        if (body.enabled === true && !config.enabled) {
            const manifest = registryEntry?.manifest as Record<string, unknown> | undefined;

            // Build default feature flags (all features enabled)
            const defaultFlags = this.buildDefaultFeatureFlags(manifest);

            await this.configRepo.update(config.id, {
                enabled: true,
                adoptedVersion: registryEntry?.currentVersion ?? config.manifestVersion,
                pendingVersion: null,
                featureFlags: { ...defaultFlags, ...(config.featureFlags ?? {}) },
                activatedAt: new Date(),
                activatedBy: user.sub,
            });

            // Seed permissions from manifest
            if (manifest && registryEntry?.manifest) {
                await this.seedModulePermissions(orgId, registryEntry.manifest);
            }
        } else if (body.enabled === false && config.enabled) {
            await this.configRepo.update(config.id, {
                enabled: false,
                deactivatedAt: new Date(),
            });
        }

        // ── B. Feature flags partial update ───────────────────────────
        if (body.featureFlags && Object.keys(body.featureFlags).length > 0) {
            await this.configRepo.query(
                `UPDATE org_module_configs
                 SET feature_flags = feature_flags || $1::jsonb, updated_at = NOW()
                 WHERE id = $2`,
                [JSON.stringify(body.featureFlags), config.id],
            );
        }

        // ── C. Adopt new version ──────────────────────────────────────
        if (body.adoptVersion && config.pendingVersion) {
            await this.configRepo.update(config.id, {
                adoptedVersion: config.pendingVersion,
                pendingVersion: null,
            });
            // Re-seed permissions for new version
            if (registryEntry?.manifest) {
                await this.seedModulePermissions(orgId, registryEntry.manifest);
            }
        }

        // ── D. Notes update ──────────────────────────────────────────
        if (body.notes !== undefined) {
            await this.configRepo.query(
                `UPDATE org_module_configs SET notes = $1, updated_at = NOW() WHERE id = $2`,
                [body.notes, config.id],
            );
        }

        // ── E. Menu override ─────────────────────────────────────────
        if (body.menuOverride !== undefined) {
            await this.configRepo.query(
                `UPDATE org_module_configs SET settings = settings || $1::jsonb, updated_at = NOW() WHERE id = $2`,
                [JSON.stringify({ menuOverride: body.menuOverride }), config.id],
            );
        }

        const updated = await this.configRepo.findOne({ where: { orgId, moduleId } });
        return {
            statusCode: 200,
            data: {
                moduleId,
                enabled: updated?.enabled,
                featureFlags: updated?.featureFlags,
                adoptedVersion: updated?.adoptedVersion,
                pendingVersion: updated?.pendingVersion,
            },
        };
    }

    // ─── POST /api/v1/auth/modules/org/:orgId/apply-defaults ──────────
    @Post('org/:orgId/apply-defaults')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('auth:organizations:write')
    async applyModulePreset(
        @Param('orgId') orgId: string,
        @CurrentUser() user: { sub: string },
        @Body() body: { preset: 'starter' | 'standard' | 'full' | 'custom'; moduleIds?: string[] },
    ) {
        let targetModules: string[];
        const allRegistry = await this.registryRepo.find();
        if (body.preset === 'full') {
            targetModules = allRegistry.map(m => m.moduleId);
        } else if (body.preset === 'custom') {
            targetModules = body.moduleIds ?? [];
        } else {
            targetModules = PRESETS[body.preset] ?? [];
        }

        // Topologically sort so dependencies are always enabled before their dependents
        const regMap = new Map(allRegistry.map(r => [r.moduleId, r]));
        const targetSet = new Set(targetModules);
        const depMap = new Map<string, string[]>();
        for (const modId of targetModules) {
            const mf = regMap.get(modId)?.manifest as Record<string, unknown> | undefined;
            const deps = ((mf?.['compatibility'] as Record<string, unknown>)?.['dependencies'] as Array<{ module: string; optional: boolean }> | undefined) ?? [];
            depMap.set(modId, deps.filter(d => !d.optional && targetSet.has(d.module)).map(d => d.module));
        }
        targetModules = this.topoSortModules(targetModules, depMap);

        const results: Array<{ moduleId: string; success: boolean; error?: string }> = [];
        for (const moduleId of targetModules) {
            try {
                await this.updateOrgModule(orgId, moduleId, user, { enabled: true });
                results.push({ moduleId, success: true });
            } catch (e: unknown) {
                const msg = e instanceof ConflictException ? 'dependency missing' : 'error';
                results.push({ moduleId, success: false, error: msg });
            }
        }

        return { statusCode: 200, data: { applied: results.filter(r => r.success).length, results } };
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    private topoSortModules(modules: string[], depMap: Map<string, string[]>): string[] {
        const visited = new Set<string>();
        const result: string[] = [];
        const visit = (mod: string) => {
            if (visited.has(mod)) return;
            visited.add(mod);
            for (const dep of depMap.get(mod) ?? []) visit(dep);
            result.push(mod);
        };
        for (const mod of modules) visit(mod);
        return result;
    }

    private async buildOrgModuleResponse(orgId: string) {
        const [registryList, configs] = await Promise.all([
            this.registryRepo.find({ order: { moduleKey: 'ASC' } }),
            this.configRepo.find({ where: { orgId } }),
        ]);

        const configMap = new Map(configs.map(c => [c.moduleId, c]));

        const data = registryList.map(reg => {
            const cfg = configMap.get(reg.moduleId);
            const hasUpdate = !!cfg?.pendingVersion && cfg.pendingVersion !== cfg.adoptedVersion;
            return {
                moduleId: reg.moduleId,
                moduleKey: reg.moduleKey,
                moduleName: reg.moduleName,
                tier: cfg?.tier ?? reg.tier,
                enabled: cfg?.enabled ?? false,
                adoptedVersion: cfg?.adoptedVersion ?? null,
                pendingVersion: cfg?.pendingVersion ?? null,
                hasUpdate,
                featureFlags: cfg?.featureFlags ?? {},
                manifest: reg.manifest,
                settings: cfg?.settings ?? {},
                activatedAt: cfg?.activatedAt ?? null,
                activatedBy: cfg?.activatedBy ?? null,
                notes: (cfg as OrgModuleConfigOrmEntity & { notes?: string })?.notes ?? null,
            };
        });

        return { statusCode: 200, data };
    }

    private buildDefaultFeatureFlags(manifest: Record<string, unknown> | undefined): Record<string, boolean> {
        const flags: Record<string, boolean> = {};
        const permissions = (manifest?.['permissions'] as Array<{ resource: string; actions: Array<{ id: string }> }> | undefined) ?? [];
        for (const group of permissions) {
            for (const action of group.actions ?? []) {
                if (action.id) flags[action.id] = true;
            }
        }
        return flags;
    }

    private async seedModulePermissions(orgId: string, manifest: Record<string, unknown>): Promise<void> {
        const permissions = (manifest['permissions'] as Array<{
            resource: string;
            actions: Array<{ id: string; name: string; description: string }>;
        }> | undefined) ?? [];

        for (const group of permissions) {
            for (const action of group.actions ?? []) {
                if (!action.id) continue;
                const parts = action.id.split(':');
                const resourceAction = parts[1] ?? '';
                const [resource, verb] = resourceAction.split('.');
                await this.permissionRepo.query(
                    `INSERT INTO permissions (id, tenant_id, resource, action, scope, code, description)
                     VALUES (gen_random_uuid(), $1, $2, $3, 'organisation', $4, $5)
                     ON CONFLICT (tenant_id, resource, action, scope) DO UPDATE
                       SET code        = EXCLUDED.code,
                           description = EXCLUDED.description,
                           updated_at  = NOW()`,
                    [orgId, group.resource ?? resource, verb ?? resourceAction, action.id, action.description ?? action.name],
                );
            }
        }
    }
}
