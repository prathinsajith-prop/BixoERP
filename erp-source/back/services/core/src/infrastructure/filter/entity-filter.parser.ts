/**
 * @deprecated Use {@link FilterBuilder} from `./filter-builder` instead.
 * This file is kept for backwards compatibility only and will be removed in a future cleanup.
 * All new filter logic should use `FilterBuilder.for(fields)` with definitions from `./filter-definitions`.
 */

export type { FilterFieldConfig, FilterOperator } from './filter-builder';

// ─── Legacy class kept for existing imports ─────────────────────────────────
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { FilterFieldConfig, FilterOperator } from './filter-builder';

/** @deprecated */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @deprecated Use {@link FilterBuilder} from `./filter-builder` instead.
 * Kept only for backwards compatibility — do NOT add new usages.
 */
export class EntityFilterParser {
    /**
     * Appends a case-insensitive LIKE search across multiple columns using OR.
     *
     * @param qb         - The query builder to modify (in place).
     * @param alias      - The entity alias used in the query (e.g. `'u'`).
     * @param search     - The raw search term from the request.
     * @param columns    - Column names to search across (on the given `alias`).
     */
    applySearch<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        alias: string,
        search: string,
        columns: string[],
    ): void {
        if (!search || columns.length === 0) return;
        const term = `%${search.toLowerCase()}%`;
        const condition = columns.map((c) => `LOWER(${alias}.${c}) LIKE :_fts`).join(' OR ');
        qb.andWhere(`(${condition})`, { _fts: term });
    }

    /**
     * Parses a structured filter string (e.g. `"status:EQ(ACTIVE);division:IN(uuid1,uuid2)"`)
     * and appends the corresponding WHERE clauses to the query builder.
     *
     * Only fields explicitly listed in `allowedFields` are applied; unknown keys are silently
     * ignored, preventing injection through unexpected field names.
     *
     * @param qb            - The query builder to modify (in place).
     * @param alias         - The entity alias used in the query.
     * @param filterStr     - The raw filter string from the request.
     * @param allowedFields - Allowlist of field configurations the caller permits.
     */
    applyFilterString<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        alias: string,
        filterStr: string,
        allowedFields: FilterFieldConfig[],
    ): void {
        if (!filterStr) return;

        const fieldMap = new Map(allowedFields.map((f) => [f.key, f]));

        for (const segment of filterStr.split(';')) {
            const match = segment.trim().match(/^(\w+):(\w+)\(([^)]*)\)$/);
            if (!match) continue;

            const [, key, op, rawValue] = match;
            const config = fieldMap.get(key);
            if (!config) continue;
            if (!config.operators.includes(op as FilterOperator)) continue;

            const col = `${alias}.${config.column}`;
            // Use a unique parameter key per field to avoid collisions across segments.
            const paramKey = `_fp_${key}`;

            switch (config.type) {
                case 'enum': {
                    const val = rawValue.toUpperCase();
                    if (config.allowedValues && !config.allowedValues.includes(val)) break;
                    if (op === 'EQ') {
                        qb.andWhere(`${col} = :${paramKey}`, { [paramKey]: val });
                    } else if (op === 'NEQ') {
                        qb.andWhere(`${col} != :${paramKey}`, { [paramKey]: val });
                    }
                    break;
                }

                case 'uuid': {
                    const ids = rawValue
                        .split(',')
                        .map((id) => id.trim())
                        .filter((id) => UUID_RE.test(id));
                    if (ids.length === 0) break;
                    if (op === 'EQ') {
                        qb.andWhere(`${col} = :${paramKey}`, { [paramKey]: ids[0] });
                    } else if (op === 'NEQ') {
                        qb.andWhere(`${col} != :${paramKey}`, { [paramKey]: ids[0] });
                    } else if (op === 'IN') {
                        qb.andWhere(`${col} IN (:...${paramKey})`, { [paramKey]: ids });
                    } else if (op === 'NOT_IN') {
                        qb.andWhere(`${col} NOT IN (:...${paramKey})`, { [paramKey]: ids });
                    }
                    break;
                }

                case 'array_uuid': {
                    // Field is a PostgreSQL uuid[] column.
                    // Uses the `&&` (overlap) operator to test membership.
                    const ids = rawValue
                        .split(',')
                        .map((id) => id.trim())
                        .filter((id) => UUID_RE.test(id));
                    if (ids.length === 0) break;
                    const params: Record<string, string> = {};
                    const placeholders = ids
                        .map((id, i) => {
                            params[`${paramKey}${i}`] = id;
                            return `:${paramKey}${i}`;
                        })
                        .join(',');
                    if (op === 'IN') {
                        qb.andWhere(`${col} && ARRAY[${placeholders}]::uuid[]`, params);
                    } else if (op === 'NOT_IN') {
                        qb.andWhere(`NOT (${col} && ARRAY[${placeholders}]::uuid[])`, params);
                    }
                    break;
                }

                case 'text': {
                    if (op === 'LIKE') {
                        qb.andWhere(`LOWER(${col}) LIKE :${paramKey}`, {
                            [paramKey]: `%${rawValue.toLowerCase()}%`,
                        });
                    } else if (op === 'EQ') {
                        qb.andWhere(`${col} = :${paramKey}`, { [paramKey]: rawValue });
                    }
                    break;
                }
            }
        }
    }
}
