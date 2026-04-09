import { Logger } from '@nestjs/common';
import { SelectQueryBuilder, ObjectLiteral, Brackets } from 'typeorm';

/** Validates a well-formed UUID v4 string to prevent injection via uuid filter values. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** No-value operators that carry no user-supplied value and skip value validation. */
const NO_VALUE_OPS = new Set(['IS_NULL', 'IS_NOT_NULL', 'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TRUE', 'IS_FALSE']);

export type FilterOperator =
    | 'EQ' | 'NEQ'
    | 'IN' | 'NOT_IN'
    | 'LIKE' | 'NOT_LIKE' | 'STARTS_WITH' | 'ENDS_WITH' | 'IS_EMPTY' | 'IS_NOT_EMPTY'
    | 'GT' | 'LT' | 'GTE' | 'LTE' | 'BETWEEN'
    | 'DATE_EQ' | 'DATE_LT' | 'DATE_GT'
    | 'IS_NULL' | 'IS_NOT_NULL'
    | 'IS_TRUE' | 'IS_FALSE';

/**
 * Describes how a single filter field should be parsed and applied.
 *
 * - `enum`       — value uppercased and checked against `allowedValues`; EQ / NEQ / IN / NOT_IN supported
 * - `uuid`       — value(s) validated as UUIDs; EQ / NEQ / IN / NOT_IN supported
 * - `array_uuid` — PostgreSQL uuid[] column; uses `&&` array-overlap; IN / NOT_IN supported
 * - `text`       — string; LIKE / NOT_LIKE / STARTS_WITH / ENDS_WITH / EQ / NEQ / IN / NOT_IN /
 *                  IS_EMPTY / IS_NOT_EMPTY / IS_NULL / IS_NOT_NULL supported
 * - `number`     — numeric; GT / LT / GTE / LTE / EQ / NEQ / BETWEEN / IS_NULL / IS_NOT_NULL supported
 * - `date`       — ISO date; DATE_EQ / DATE_LT / DATE_GT / BETWEEN / IS_NULL / IS_NOT_NULL supported
 * - `boolean`    — DB boolean column; IS_TRUE / IS_FALSE / EQ(true|false) / NEQ supported
 */
export interface FilterFieldConfig {
    /** Token used in the query string, e.g. `'status'`, `'division'`. */
    key: string;
    /** Column on the ORM entity alias, e.g. `'status'`, `'division_id'`. */
    column: string;
    type: 'enum' | 'uuid' | 'array_uuid' | 'text' | 'number' | 'date' | 'boolean';
    operators: FilterOperator[];
    /** Enforced only when `type === 'enum'`. */
    allowedValues?: string[];
}

/** Reason a filter segment was rejected. */
export type RejectionReason =
    | 'unknown_key'
    | 'operator_not_allowed'
    | 'invalid_enum_value'
    | 'invalid_uuid'
    | 'invalid_number'
    | 'invalid_date'
    | 'invalid_boolean'
    | 'malformed_segment';

/** A single rejected filter segment with its reason. */
export interface RejectedFilter {
    key: string;
    operator?: string;
    value?: string;
    reason: RejectionReason;
}

/** Returned by {@link FilterBuilder.applyFilters}. */
export interface FilterApplicationResult {
    /** Keys whose conditions were successfully applied. */
    appliedKeys: string[];
    /** Segments that were rejected with a structured reason. */
    rejectedFilters: RejectedFilter[];
}

export interface FilterBuilderOptions {
    /**
     * Optional NestJS logger. When provided, rejected filter segments are
     * logged at `warn` level so operators immediately see misconfigured UIs.
     */
    logger?: Logger;
    /** Context tag appended to log messages, e.g. `'DivisionRepo'`. */
    context?: string;
}

/** Sort direction for {@link FilterBuilder.applySort}. */
export type SortDirection = 'ASC' | 'DESC';

/** A parameterised SQL fragment ready to pass to andWhere / where / orWhere. */
interface BuiltCondition {
    sql: string;
    params: Record<string, unknown>;
}

/**
 * Centralized, type-safe query-condition builder for TypeORM repositories.
 *
 * All filter logic lives here — no scattered `andWhere` calls in repos.
 * Repositories obtain a pre-configured instance via {@link FilterBuilder.for}:
 *
 * ```ts
 * const builder = FilterBuilder.for(DIVISION_FILTERS, { logger, context: 'DivisionRepo' });
 *
 * builder.applySearch(qb, 'd', search, DIVISION_SEARCH_COLUMNS);
 * builder.applySort(qb, 'd', sort, { name: 'name', created_at: 'created_at' });
 * const { appliedKeys, rejectedFilters } = builder.applyFilters(qb, 'd', filter);
 * ```
 *
 * ### Filter syntax
 * - Plain AND segment:    `field:OP(value)`
 * - OR group:             `(field1:OP(v1)|field2:OP(v2))`
 * - Multiple, AND-joined: `segment1;(or_group);segment2`
 *
 * Example: `(status:EQ(ACTIVE)|status:EQ(PENDING));name:LIKE(alice)`
 *
 * ### Validation rules
 * Each filter segment must:
 * 1. Have a key registered in the field config (`unknown_key` if not)
 * 2. Use an operator permitted for that field (`operator_not_allowed` if not)
 * 3. For `enum` fields: every value must pass `allowedValues` check (`invalid_enum_value`)
 * 4. For `uuid` / `array_uuid` fields: each value must be a valid UUID (`invalid_uuid`)
 * 5. Conform to `field:OPERATOR(value)` syntax (`malformed_segment`)
 *
 * Unknown / invalid segments are logged (if a logger is supplied) and skipped
 * — they never reach the query builder, preventing injection attacks.
 *
 * ### Parameter key collision note
 * Using the same field key more than once in the plain AND chain produces duplicate
 * TypeORM parameter names (`_fp_<key>`); the last value wins in the params map.
 * For multi-value AND on the same column, use `BETWEEN` for ranges or wrap
 * alternatives inside an OR group. OR-group segments always receive unique
 * param suffixes to guarantee correct SQL.
 */
export class FilterBuilder {
    private readonly fieldMap: Map<string, FilterFieldConfig>;
    private readonly logger?: Logger;
    private readonly context: string;

    private constructor(fields: FilterFieldConfig[], options: FilterBuilderOptions = {}) {
        this.fieldMap = new Map(fields.map((f) => [f.key, f]));
        this.logger = options.logger;
        this.context = options.context ?? 'FilterBuilder';
    }

    /**
     * Factory method — creates a `FilterBuilder` pre-configured for a specific entity.
     *
     * @param fields  — The field allowlist from `filter-definitions.ts`.
     * @param options — Optional logger / context tag.
     */
    static for(fields: FilterFieldConfig[], options?: FilterBuilderOptions): FilterBuilder {
        return new FilterBuilder(fields, options);
    }

    /**
     * Returns the set of keys registered in this builder's field config.
     * Useful for introspection in tests and API metadata endpoints.
     */
    get supportedKeys(): string[] {
        return [...this.fieldMap.keys()];
    }

    /**
     * Validates a raw filter string **without** modifying any query builder.
     * Supports the same OR-group syntax as `applyFilters`.
     *
     * @param filterStr — The raw `filter` query-string parameter.
     */
    validate(filterStr: string): FilterApplicationResult {
        if (!filterStr) return { appliedKeys: [], rejectedFilters: [] };

        const appliedKeys: string[] = [];
        const rejectedFilters: RejectedFilter[] = [];

        for (const token of this._tokenize(filterStr)) {
            const segments = Array.isArray(token) ? token : [token];
            for (const seg of segments) {
                const match = seg.match(/^(\w+):(\w+)\(([^)]*)\)$/);
                if (!match) {
                    rejectedFilters.push({ key: seg, reason: 'malformed_segment' });
                    continue;
                }
                const [, key, op, rawValue] = match;
                const validation = this._validateSegment(key, op, rawValue);
                if (validation === true) appliedKeys.push(key);
                else rejectedFilters.push(validation);
            }
        }

        return { appliedKeys, rejectedFilters };
    }

    /**
     * Appends a case-insensitive `LIKE` search across multiple columns (OR-joined).
     *
     * The search term is parameterised to prevent SQL injection.
     *
     * @param qb      — QueryBuilder to modify in-place.
     * @param alias   — Entity alias used in the query (e.g. `'u'`).
     * @param search  — Raw search string from the request.
     * @param columns — Column names to search (on the given alias).
     * @returns `this` for optional chaining.
     */
    applySearch<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        alias: string,
        search: string | undefined,
        columns: string[],
    ): this {
        if (!search || columns.length === 0) return this;
        const term = `%${search.toLowerCase()}%`;
        const conditions = columns.map((c) => `LOWER(${alias}.${c}) LIKE :_fts`).join(' OR ');
        qb.andWhere(`(${conditions})`, { _fts: term });
        return this;
    }

    /**
     * Applies allowlisted `ORDER BY` clauses from a sort string.
     *
     * **Syntax:** `field:ASC` or `field:DESC`, semicolon-separated for multi-column sort.
     * Priority is left-to-right. Unknown or malformed tokens are skipped and logged.
     *
     * @param qb             — QueryBuilder to modify in-place.
     * @param alias          — Entity alias used in the query.
     * @param sortStr        — Raw `sort` query-string value, e.g. `'name:ASC;created_at:DESC'`.
     * @param allowedColumns — Map of `{ sortKey → columnName }` pairs that are permitted.
     * @returns `this` for optional chaining.
     *
     * Example:
     * ```ts
     * builder.applySort(qb, 'u', sort, { name: 'first_name', created_at: 'created_at' });
     * ```
     */
    applySort<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        alias: string,
        sortStr: string | undefined,
        allowedColumns: Record<string, string>,
    ): this {
        if (!sortStr) return this;
        for (const segment of sortStr.split(';')) {
            const trimmed = segment.trim();
            if (!trimmed) continue;
            const match = trimmed.match(/^(\w+):(ASC|DESC)$/i);
            if (!match) {
                this._warn(`Malformed sort segment skipped: "${trimmed}"`);
                continue;
            }
            const [, key, dir] = match;
            const column = allowedColumns[key];
            if (!column) {
                this._warn(`Unknown sort key skipped: "${key}"`);
                continue;
            }
            qb.addOrderBy(`${alias}.${column}`, dir.toUpperCase() as SortDirection);
        }
        return this;
    }

    /**
     * Parses a structured filter string, validates every segment against the
     * registered field allowlist, and appends only the valid conditions to the
     * query builder.
     *
     * OR groups are wrapped in a TypeORM `Brackets` call so the grouped conditions
     * are parenthesised and OR-joined, while the overall AND chain is preserved.
     *
     * Invalid segments are never applied and are reported in `rejectedFilters`.
     *
     * @param qb        — QueryBuilder to modify in-place.
     * @param alias     — Entity alias.
     * @param filterStr — Raw `filter` query-string parameter.
     * @returns {@link FilterApplicationResult} with applied keys and any rejections.
     */
    applyFilters<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        alias: string,
        filterStr: string | undefined,
    ): FilterApplicationResult {
        if (!filterStr) return { appliedKeys: [], rejectedFilters: [] };

        const appliedKeys: string[] = [];
        const rejectedFilters: RejectedFilter[] = [];
        let orParamCounter = 0;

        for (const token of this._tokenize(filterStr)) {
            if (Array.isArray(token)) {
                // ── OR group — each segment gets a unique param suffix to avoid TypeORM collisions ──
                const orConditions: BuiltCondition[] = [];

                for (const seg of token) {
                    const match = seg.match(/^(\w+):(\w+)\(([^)]*)\)$/);
                    if (!match) {
                        rejectedFilters.push({ key: seg, reason: 'malformed_segment' });
                        this._warn(`Malformed OR-group segment skipped: "${seg}"`);
                        continue;
                    }
                    const [, key, op, rawValue] = match;
                    const validation = this._validateSegment(key, op, rawValue);
                    if (validation !== true) {
                        rejectedFilters.push(validation);
                        this._warn(`OR-group segment rejected — key="${key}" op="${op}" reason="${validation.reason}"`);
                        continue;
                    }
                    const cond = this._buildCondition(alias, key, op as FilterOperator, rawValue, `${++orParamCounter}`);
                    if (cond) { orConditions.push(cond); appliedKeys.push(key); }
                }

                if (orConditions.length > 0) {
                    qb.andWhere(new Brackets((inner) => {
                        orConditions.forEach((c, i) => {
                            if (i === 0) inner.where(c.sql, c.params);
                            else inner.orWhere(c.sql, c.params);
                        });
                    }));
                }
            } else {
                // ── Plain AND segment ─────────────────────────────────────────────────────────────
                const match = token.match(/^(\w+):(\w+)\(([^)]*)\)$/);
                if (!match) {
                    rejectedFilters.push({ key: token, reason: 'malformed_segment' });
                    this._warn(`Malformed filter segment skipped: "${token}"`);
                    continue;
                }
                const [, key, op, rawValue] = match;
                const validation = this._validateSegment(key, op, rawValue);
                if (validation !== true) {
                    rejectedFilters.push(validation);
                    this._warn(`Filter segment rejected — key="${key}" op="${op}" reason="${validation.reason}"`);
                    continue;
                }
                const cond = this._buildCondition(alias, key, op as FilterOperator, rawValue);
                if (cond) {
                    qb.andWhere(cond.sql, cond.params);
                    appliedKeys.push(key);
                }
            }
        }

        return { appliedKeys, rejectedFilters };
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /**
     * Tokenizes the filter string into an ordered sequence of plain segments and OR-group arrays.
     *
     * Splits at `;` at paren-depth 0. Tokens wrapped in `(...)` are treated as OR groups
     * and are split at `|` (also depth-aware to handle nested value parens).
     *
     * Plain:    `status:EQ(ACTIVE)`              → `'status:EQ(ACTIVE)'`
     * OR group: `(status:EQ(ACTIVE)|name:LIKE(x))` → `['status:EQ(ACTIVE)', 'name:LIKE(x)']`
     */
    private _tokenize(filterStr: string): Array<string | string[]> {
        const tokens: Array<string | string[]> = [];
        let depth = 0, start = 0;
        const raw = filterStr + ';'; // sentinel ensures last token is always flushed

        for (let i = 0; i < raw.length; i++) {
            if (raw[i] === '(') depth++;
            else if (raw[i] === ')') depth--;
            else if (raw[i] === ';' && depth === 0) {
                const segment = raw.slice(start, i).trim();
                start = i + 1;
                if (!segment) continue;
                if (segment.startsWith('(') && segment.endsWith(')')) {
                    tokens.push(this._splitByPipe(segment.slice(1, -1)));
                } else {
                    tokens.push(segment);
                }
            }
        }

        return tokens;
    }

    /** Splits a string by `|` at paren-depth 0 (supports nested value parens). */
    private _splitByPipe(s: string): string[] {
        const parts: string[] = [];
        let depth = 0, start = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '(') depth++;
            else if (s[i] === ')') depth--;
            else if (s[i] === '|' && depth === 0) {
                parts.push(s.slice(start, i).trim());
                start = i + 1;
            }
        }
        parts.push(s.slice(start).trim());
        return parts.filter(Boolean);
    }

    /**
     * Validates a single parsed segment without mutating the query builder.
     * Returns `true` if valid, otherwise a `RejectedFilter` descriptor.
     */
    private _validateSegment(key: string, op: string, rawValue: string): true | RejectedFilter {
        const config = this.fieldMap.get(key);
        if (!config) return { key, operator: op, value: rawValue, reason: 'unknown_key' };
        if (!config.operators.includes(op as FilterOperator))
            return { key, operator: op, value: rawValue, reason: 'operator_not_allowed' };

        // No-value operators carry no user input — skip further value validation.
        if (NO_VALUE_OPS.has(op)) return true;

        if (config.type === 'enum') {
            const vals = rawValue.split(',').map((v) => v.trim().toUpperCase());
            if (config.allowedValues && vals.some((v) => !config.allowedValues!.includes(v)))
                return { key, operator: op, value: rawValue, reason: 'invalid_enum_value' };
        }

        if (config.type === 'uuid' || config.type === 'array_uuid') {
            const ids = rawValue.split(',').map((id) => id.trim());
            if (ids.some((id) => !UUID_RE.test(id)))
                return { key, operator: op, value: rawValue, reason: 'invalid_uuid' };
        }

        if (config.type === 'number') {
            const parts = rawValue.split(',').map((v) => v.trim());
            if (parts.some((v) => isNaN(Number(v)) || v === ''))
                return { key, operator: op, value: rawValue, reason: 'invalid_number' };
            if (op === 'BETWEEN' && parts.length !== 2)
                return { key, operator: op, value: rawValue, reason: 'invalid_number' };
        }

        if (config.type === 'date') {
            const parts = rawValue.split(',').map((v) => v.trim());
            if (parts.some((v) => isNaN(Date.parse(v))))
                return { key, operator: op, value: rawValue, reason: 'invalid_date' };
            if (op === 'BETWEEN' && parts.length !== 2)
                return { key, operator: op, value: rawValue, reason: 'invalid_date' };
        }

        if (config.type === 'boolean') {
            const v = rawValue.toLowerCase();
            if (v !== 'true' && v !== 'false')
                return { key, operator: op, value: rawValue, reason: 'invalid_boolean' };
        }

        return true;
    }

    /**
     * Builds a parameterised SQL condition from an already-validated segment.
     *
     * @param paramSuffix — When provided (always used for OR-group segments), the TypeORM
     *                      parameter key becomes `_fp_<key>_<suffix>` to guarantee uniqueness
     *                      and prevent value collision inside a single `Brackets` call.
     *                      Omit for plain AND conditions to preserve the `_fp_<key>` key
     *                      format (backward-compatible with existing queries).
     */
    private _buildCondition(
        alias: string,
        key: string,
        op: FilterOperator,
        rawValue: string,
        paramSuffix?: string,
    ): BuiltCondition | null {
        const config = this.fieldMap.get(key)!;
        const col = `${alias}.${config.column}`;
        const p = paramSuffix ? `_fp_${key}_${paramSuffix}` : `_fp_${key}`;

        // ── No-value operators ───────────────────────────────────────────────────
        if (op === 'IS_NULL') return { sql: `${col} IS NULL`, params: {} };
        if (op === 'IS_NOT_NULL') return { sql: `${col} IS NOT NULL`, params: {} };
        if (op === 'IS_EMPTY') return { sql: `(${col} IS NULL OR ${col} = '')`, params: {} };
        if (op === 'IS_NOT_EMPTY') return { sql: `(${col} IS NOT NULL AND ${col} != '')`, params: {} };
        if (op === 'IS_TRUE') return { sql: `${col} = TRUE`, params: {} };
        if (op === 'IS_FALSE') return { sql: `${col} = FALSE`, params: {} };

        switch (config.type) {
            case 'enum': {
                const vals = rawValue.split(',').map((v) => v.trim().toUpperCase());
                if (op === 'EQ') return { sql: `${col} = :${p}`, params: { [p]: vals[0] } };
                if (op === 'NEQ') return { sql: `${col} != :${p}`, params: { [p]: vals[0] } };
                if (op === 'IN') return { sql: `${col} IN (:...${p})`, params: { [p]: vals } };
                if (op === 'NOT_IN') return { sql: `${col} NOT IN (:...${p})`, params: { [p]: vals } };
                break;
            }

            case 'uuid': {
                const ids = rawValue.split(',').map((id) => id.trim()).filter((id) => UUID_RE.test(id));
                if (!ids.length) return null;
                if (op === 'EQ') return { sql: `${col} = :${p}`, params: { [p]: ids[0] } };
                if (op === 'NEQ') return { sql: `${col} != :${p}`, params: { [p]: ids[0] } };
                if (op === 'IN') return { sql: `${col} IN (:...${p})`, params: { [p]: ids } };
                if (op === 'NOT_IN') return { sql: `${col} NOT IN (:...${p})`, params: { [p]: ids } };
                break;
            }

            case 'array_uuid': {
                // PostgreSQL uuid[] column — uses && (overlap) operator.
                const ids = rawValue.split(',').map((id) => id.trim()).filter((id) => UUID_RE.test(id));
                if (!ids.length) return null;
                const arrayParams: Record<string, string> = {};
                const placeholders = ids.map((id, i) => {
                    arrayParams[`${p}${i}`] = id;
                    return `:${p}${i}`;
                }).join(',');
                if (op === 'IN') return { sql: `${col} && ARRAY[${placeholders}]::uuid[]`, params: arrayParams };
                if (op === 'NOT_IN') return { sql: `NOT (${col} && ARRAY[${placeholders}]::uuid[])`, params: arrayParams };
                break;
            }

            case 'text': {
                const v = rawValue.toLowerCase();
                const vals = rawValue.split(',').map((s) => s.trim());
                if (op === 'LIKE') return { sql: `LOWER(${col}) LIKE :${p}`, params: { [p]: `%${v}%` } };
                if (op === 'NOT_LIKE') return { sql: `LOWER(${col}) NOT LIKE :${p}`, params: { [p]: `%${v}%` } };
                if (op === 'STARTS_WITH') return { sql: `LOWER(${col}) LIKE :${p}`, params: { [p]: `${v}%` } };
                if (op === 'ENDS_WITH') return { sql: `LOWER(${col}) LIKE :${p}`, params: { [p]: `%${v}` } };
                if (op === 'EQ') return { sql: `${col} = :${p}`, params: { [p]: rawValue } };
                if (op === 'NEQ') return { sql: `${col} != :${p}`, params: { [p]: rawValue } };
                if (op === 'IN') return { sql: `${col} IN (:...${p})`, params: { [p]: vals } };
                if (op === 'NOT_IN') return { sql: `${col} NOT IN (:...${p})`, params: { [p]: vals } };
                break;
            }

            case 'number': {
                const parts = rawValue.split(',').map((v) => Number(v.trim()));
                if (op === 'EQ') return { sql: `${col} = :${p}`, params: { [p]: parts[0] } };
                if (op === 'NEQ') return { sql: `${col} != :${p}`, params: { [p]: parts[0] } };
                if (op === 'GT') return { sql: `${col} > :${p}`, params: { [p]: parts[0] } };
                if (op === 'LT') return { sql: `${col} < :${p}`, params: { [p]: parts[0] } };
                if (op === 'GTE') return { sql: `${col} >= :${p}`, params: { [p]: parts[0] } };
                if (op === 'LTE') return { sql: `${col} <= :${p}`, params: { [p]: parts[0] } };
                if (op === 'BETWEEN') return { sql: `${col} BETWEEN :${p}Min AND :${p}Max`, params: { [`${p}Min`]: parts[0], [`${p}Max`]: parts[1] } };
                break;
            }

            case 'date': {
                const parts = rawValue.split(',').map((v) => v.trim());
                if (op === 'DATE_EQ') return { sql: `DATE(${col}) = :${p}`, params: { [p]: parts[0] } };
                if (op === 'DATE_LT') return { sql: `${col} < :${p}`, params: { [p]: parts[0] } };
                if (op === 'DATE_GT') return { sql: `${col} > :${p}`, params: { [p]: parts[0] } };
                if (op === 'BETWEEN') return { sql: `${col} BETWEEN :${p}From AND :${p}To`, params: { [`${p}From`]: parts[0], [`${p}To`]: parts[1] } };
                break;
            }

            case 'boolean': {
                const bv = rawValue.toLowerCase() === 'true';
                if (op === 'EQ') return { sql: `${col} = :${p}`, params: { [p]: bv } };
                if (op === 'NEQ') return { sql: `${col} != :${p}`, params: { [p]: bv } };
                break;
            }
        }

        return null;
    }

    private _warn(message: string): void {
        if (this.logger) this.logger.warn(message, this.context);
    }
}
