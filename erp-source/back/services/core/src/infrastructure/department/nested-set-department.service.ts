import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DepartmentOrmEntity } from '../persistence/entity/department.orm-entity';

export interface DepartmentTreeNode {
    id: string;
    name: string;
    code: string;
    type: string;
    parentId: string | null;
    managerId: string | null;
    depth: number;
    lft: number;
    rgt: number;
    children: DepartmentTreeNode[];
}

/**
 * Implements the Modified Preorder Tree Traversal (nested set) pattern for
 * O(1) subtree queries.  All tree-mutating operations wrap in a transaction
 * and shift lft/rgt pointers atomically.
 *
 * This service works alongside the existing PostgresDepartmentRepository —
 * flat CRUD still goes through there; tree-specific ops come here.
 */
@Injectable()
export class NestedSetDepartmentService {
    constructor(
        @InjectRepository(DepartmentOrmEntity)
        private readonly repo: Repository<DepartmentOrmEntity>,
        private readonly dataSource: DataSource,
    ) { }

    /** Return the full tree as a nested object for an organisation */
    async getTree(tenantId: string, organizationId: string): Promise<DepartmentTreeNode[]> {
        const rows = await this.repo.find({
            where: { tenant_id: tenantId, organization_id: organizationId },
            order: { lft: 'ASC' },
        });
        return this.buildTree(rows);
    }

    /** Return all descendants of a node (inclusive) */
    async getSubtree(tenantId: string, nodeId: string): Promise<DepartmentOrmEntity[]> {
        const node = await this.repo.findOne({ where: { id: nodeId, tenant_id: tenantId } });
        if (!node) throw new NotFoundException('Department not found');
        return this.repo
            .createQueryBuilder('d')
            .where('d.tenant_id = :tenantId', { tenantId })
            .andWhere('d.organization_id = :orgId', { orgId: node.organization_id })
            .andWhere('d.lft >= :lft', { lft: node.lft })
            .andWhere('d.rgt <= :rgt', { rgt: node.rgt })
            .orderBy('d.lft', 'ASC')
            .getMany();
    }

    /** Return the path from root to a node (breadcrumb) */
    async getAncestors(tenantId: string, nodeId: string): Promise<DepartmentOrmEntity[]> {
        const node = await this.repo.findOne({ where: { id: nodeId, tenant_id: tenantId } });
        if (!node) throw new NotFoundException('Department not found');
        return this.repo
            .createQueryBuilder('d')
            .where('d.tenant_id = :tenantId', { tenantId })
            .andWhere('d.organization_id = :orgId', { orgId: node.organization_id })
            .andWhere('d.lft < :lft', { lft: node.lft })
            .andWhere('d.rgt > :rgt', { rgt: node.rgt })
            .orderBy('d.lft', 'ASC')
            .getMany();
    }

    /**
     * Insert a new leaf node under `parentId`.
     * If parentId is null, insert as a root node (highest rgt + 2).
     */
    async addNode(params: {
        id: string;
        tenantId: string;
        organizationId: string;
        parentId: string | null;
        type?: string;
        managerId?: string | null;
    }): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(DepartmentOrmEntity);

            let insertLft: number;
            let insertDepth: number;

            if (params.parentId) {
                const parent = await repo.findOne({
                    where: { id: params.parentId, tenant_id: params.tenantId },
                });
                if (!parent) throw new NotFoundException('Parent department not found');

                insertLft = parent.rgt;
                insertDepth = (parent.depth ?? 0) + 1;

                // Shift existing lft/rgt to make room
                await manager.query(
                    `UPDATE departments SET rgt = rgt + 2 WHERE tenant_id = $1 AND organization_id = $2 AND rgt >= $3`,
                    [params.tenantId, params.organizationId, parent.rgt],
                );
                await manager.query(
                    `UPDATE departments SET lft = lft + 2 WHERE tenant_id = $1 AND organization_id = $2 AND lft >= $3`,
                    [params.tenantId, params.organizationId, parent.rgt],
                );
            } else {
                // Root node — find max rgt
                const max = await manager.query(
                    `SELECT COALESCE(MAX(rgt), 0) as maxrgt FROM departments WHERE tenant_id = $1 AND organization_id = $2`,
                    [params.tenantId, params.organizationId],
                );
                insertLft = (max[0]?.maxrgt ?? 0) + 1;
                insertDepth = 0;
            }

            await manager.query(
                `UPDATE departments SET lft = $1, rgt = $2, depth = $3, parent_id = $4, type = COALESCE($5, type), manager_id = COALESCE($6, manager_id)
         WHERE id = $7 AND tenant_id = $8`,
                [
                    insertLft,
                    insertLft + 1,
                    insertDepth,
                    params.parentId ?? null,
                    params.type ?? null,
                    params.managerId ?? null,
                    params.id,
                    params.tenantId,
                ],
            );
        });
    }

    /**
     * Move a subtree to a new parent.
     * Guards against moving a node to its own descendant.
     */
    async moveNode(tenantId: string, nodeId: string, newParentId: string | null): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(DepartmentOrmEntity);

            const node = await repo.findOne({ where: { id: nodeId, tenant_id: tenantId } });
            if (!node) throw new NotFoundException('Department not found');

            if (newParentId) {
                const newParent = await repo.findOne({ where: { id: newParentId, tenant_id: tenantId } });
                if (!newParent) throw new NotFoundException('Target parent not found');
                // Prevent moving into own subtree
                if (newParent.lft >= node.lft && newParent.rgt <= node.rgt) {
                    throw new BadRequestException('Cannot move a node into its own subtree');
                }
            }

            const subtreeWidth = node.rgt - node.lft + 1;
            const orgId = node.organization_id;

            // Step 1: Mark the subtree as "out of tree" using negative values
            await manager.query(
                `UPDATE departments SET lft = 0 - lft, rgt = 0 - rgt WHERE tenant_id = $1 AND organization_id = $2 AND lft >= $3 AND rgt <= $4`,
                [tenantId, orgId, node.lft, node.rgt],
            );

            // Step 2: Close the gap left by the removed subtree
            await manager.query(
                `UPDATE departments SET rgt = rgt - $1 WHERE tenant_id = $2 AND organization_id = $3 AND rgt > $4 AND lft > 0`,
                [subtreeWidth, tenantId, orgId, node.rgt],
            );
            await manager.query(
                `UPDATE departments SET lft = lft - $1 WHERE tenant_id = $2 AND organization_id = $3 AND lft > $4 AND lft > 0`,
                [subtreeWidth, tenantId, orgId, node.rgt],
            );

            // Step 3: Find insertion point
            let insertAfter: number;
            let newDepth: number;
            if (newParentId) {
                const newParent = await repo.findOne({ where: { id: newParentId, tenant_id: tenantId } });
                insertAfter = newParent!.rgt;
                newDepth = (newParent!.depth ?? 0) + 1;
            } else {
                const max = await manager.query(
                    `SELECT COALESCE(MAX(rgt), 0) as maxrgt FROM departments WHERE tenant_id = $1 AND organization_id = $2 AND lft > 0`,
                    [tenantId, orgId],
                );
                insertAfter = max[0]?.maxrgt ?? 0;
                newDepth = 0;
            }

            // Step 4: Make room at the insertion point
            await manager.query(
                `UPDATE departments SET rgt = rgt + $1 WHERE tenant_id = $2 AND organization_id = $3 AND rgt >= $4 AND lft > 0`,
                [subtreeWidth, tenantId, orgId, insertAfter],
            );
            await manager.query(
                `UPDATE departments SET lft = lft + $1 WHERE tenant_id = $2 AND organization_id = $3 AND lft >= $4 AND lft > 0`,
                [subtreeWidth, tenantId, orgId, insertAfter],
            );

            // Step 5: Place the subtree into the new position
            const depthDelta = newDepth - (node.depth ?? 0);
            const shift = insertAfter - node.lft + 1;
            await manager.query(
                `UPDATE departments SET lft = 0 - lft + $1, rgt = 0 - rgt + $1, depth = depth + $2, parent_id = CASE WHEN id = $3 THEN $4 ELSE parent_id END
         WHERE tenant_id = $5 AND organization_id = $6 AND lft < 0`,
                [shift, depthDelta, nodeId, newParentId ?? null, tenantId, orgId],
            );
        });
    }

    /** Delete a leaf node (will fail if node has children — promotes safety) */
    async deleteLeafNode(tenantId: string, nodeId: string): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const node = await manager.findOne(DepartmentOrmEntity, {
                where: { id: nodeId, tenant_id: tenantId },
            });
            if (!node) throw new NotFoundException('Department not found');
            if (node.rgt - node.lft > 1) {
                throw new BadRequestException(
                    'Cannot delete a department that has sub-departments. Move or delete children first.',
                );
            }

            await manager.delete(DepartmentOrmEntity, { id: nodeId });
            await manager.query(
                `UPDATE departments SET rgt = rgt - 2 WHERE tenant_id = $1 AND organization_id = $2 AND rgt > $3`,
                [tenantId, node.organization_id, node.rgt],
            );
            await manager.query(
                `UPDATE departments SET lft = lft - 2 WHERE tenant_id = $1 AND organization_id = $2 AND lft > $3`,
                [tenantId, node.organization_id, node.rgt],
            );
        });
    }

    private buildTree(rows: DepartmentOrmEntity[]): DepartmentTreeNode[] {
        const map = new Map<string, DepartmentTreeNode>();
        const roots: DepartmentTreeNode[] = [];

        for (const row of rows) {
            map.set(row.id, {
                id: row.id,
                name: row.name,
                code: row.code,
                type: row.type ?? 'DEPARTMENT',
                parentId: row.parent_id ?? null,
                managerId: row.manager_id ?? null,
                depth: row.depth ?? 0,
                lft: row.lft ?? 1,
                rgt: row.rgt ?? 2,
                children: [],
            });
        }

        for (const node of map.values()) {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }

        return roots;
    }
}
