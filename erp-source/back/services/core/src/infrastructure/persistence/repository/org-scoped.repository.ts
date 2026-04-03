import {
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import {
    DataSource,
    EntityTarget,
    FindManyOptions,
    FindOneOptions,
    Repository,
} from 'typeorm';
import { ClsService } from 'nestjs-cls';

/**
 * Base repository that auto-scopes all reads and writes to the current
 * organisation extracted from the request-scoped CLS store (set by
 * OrgContextMiddleware from the JWT `org_id` claim).
 *
 * All repositories for org-scoped entities (those with `organisation_id`)
 * MUST extend this class. Never call bare TypeORM find/save on scoped entities.
 *
 * Resolution order for organisation_id:
 *  1. CLS value set by OrgContextMiddleware from JWT (always trusted)
 *  2. Throws ForbiddenException if no CLS value — never falls back to a
 *     value supplied in the request body or query string.
 */
@Injectable()
export class OrgScopedRepository<T extends { organisation_id?: string; tenant_id?: string }> {
    protected readonly repo: Repository<T>;

    constructor(
        target: EntityTarget<T>,
        dataSource: DataSource,
        protected readonly cls: ClsService,
    ) {
        this.repo = dataSource.getRepository(target);
    }

    /** Organisation ID from JWT via CLS — throws if missing. */
    protected get organisationId(): string {
        // Support both 'organisationId' (preferred) and legacy 'tenantId' key
        const id =
            this.cls.get<string>('organisationId') ??
            this.cls.get<string>('tenantId');
        if (!id) {
            throw new ForbiddenException(
                'No organisation context — a valid org-scoped JWT must be present.',
            );
        }
        return id;
    }

    /** Find all records scoped to the current organisation. */
    async findScoped(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repo.find({
            ...options,
            where: {
                ...((options?.where as object) ?? {}),
                organisation_id: this.organisationId,
            } as FindManyOptions<T>['where'],
        });
    }

    /** Find one record scoped to the current organisation. */
    async findOneScoped(options: FindOneOptions<T>): Promise<T | null> {
        return this.repo.findOne({
            ...options,
            where: {
                ...((options?.where as object) ?? {}),
                organisation_id: this.organisationId,
            } as FindOneOptions<T>['where'],
        });
    }

    /**
     * Save an entity, forcibly stamping the current organisation's ID onto it.
     * This prevents cross-org writes even if the caller omitted the field.
     */
    async saveScoped(entity: Partial<T>): Promise<T> {
        (entity as Record<string, unknown>)['organisation_id'] = this.organisationId;
        return this.repo.save(entity as T);
    }

    /**
     * Verify that a given entity's organisation_id matches the current context.
     * Use before any update/delete by ID to prevent IDOR.
     */
    async assertOwnership(entityId: string, idField = 'id'): Promise<T> {
        const item = await this.repo.findOne({
            where: { [idField]: entityId, organisation_id: this.organisationId } as FindOneOptions<T>['where'],
        });
        if (!item) {
            throw new ForbiddenException(
                'Entity not found in the current organisation context.',
            );
        }
        return item;
    }
}
