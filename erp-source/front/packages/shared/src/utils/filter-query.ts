/**
 * Frontend → Backend filter query utilities.
 *
 * These functions translate the `ActiveFilters` / `ActiveOperators` maps produced by
 * `SearchFilterBar` into the structured filter string format that every BixoERP backend
 * service accepts:
 *
 *   "field:OPERATOR(value[,value…]);…`
 *
 * Examples:
 *   status:EQ(ACTIVE)
 *   role:IN(uuid1,uuid2)
 *   createdAt:DATE_LT(2024-12-31)
 *   name:LIKE(john)
 */

/** Maps frontend operator identifiers to backend token strings. */
const OPERATOR_TOKEN_MAP: Record<string, string> = {
    is: 'EQ',
    is_not: 'NEQ',
    contains: 'LIKE',
    not_contains: 'NOT_LIKE',
    equals: 'EQ',
    starts_with: 'STARTS_WITH',
    ends_with: 'ENDS_WITH',
    in: 'IN',
    not_in: 'NOT_IN',
    between: 'BETWEEN',
    on: 'DATE_EQ',
    before: 'DATE_LT',
    after: 'DATE_GT',
    greater_than: 'GT',
    less_than: 'LT',
    gte: 'GTE',
    lte: 'LTE',
    is_null: 'IS_NULL',
    is_not_null: 'IS_NOT_NULL',
};

/**
 * Converts an `ActiveFilters` + `ActiveOperators` map into a structured filter string
 * suitable for the `?filter=` query parameter understood by BixoERP backend services.
 *
 * @param filters   Key → value map (string or string[] per filter key).
 * @param operators Key → operator name map (e.g. "is", "in", "contains").
 * @returns         Semicolon-delimited filter expression string, or `""` when empty.
 *
 * @example
 * buildFilterQueryString(
 *   { status: 'active', role: ['id1', 'id2'] },
 *   { status: 'is',     role: 'in'           },
 * )
 * // → "status:EQ(active);role:IN(id1,id2)"
 */
export function buildFilterQueryString(
    filters: Record<string, string | string[]>,
    operators: Record<string, string> = {},
): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
        // Skip empty values
        if (value === null || value === undefined) continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (!Array.isArray(value) && String(value) === '') continue;

        const operator = operators[key];

        // IS_NULL / IS_NOT_NULL carry no value
        if (operator === 'is_null' || operator === 'is_not_null') {
            parts.push(`${key}:${OPERATOR_TOKEN_MAP[operator]}()`);
            continue;
        }

        const token = operator
            ? (OPERATOR_TOKEN_MAP[operator] ?? operator.toUpperCase())
            : 'EQ';

        let serialized: string;
        if (Array.isArray(value)) {
            serialized = value.map(String).join(',');
        } else {
            serialized = String(value);
        }

        if (serialized === '') continue;

        parts.push(`${key}:${token}(${serialized})`);
    }

    return parts.join(';');
}

/**
 * Builds a complete query-string for a paginated API request.
 *
 * @param search    Full-text search term (maps to the `q` parameter).
 * @param filters   Applied filters map.
 * @param operators Applied operators map.
 * @param pagination Optional pagination / sort options.
 * @returns         `URLSearchParams` ready to be appended to a request URL.
 */
export function buildSearchParams(
    search: string,
    filters: Record<string, string | string[]>,
    operators: Record<string, string> = {},
    pagination?: { page?: number; limit?: number; sortBy?: string; sortDir?: 'asc' | 'desc' },
): Record<string, string> {
    const params: Record<string, string> = {};

    if (search.trim()) {
        params.q = search.trim();
    }

    const filterStr = buildFilterQueryString(filters, operators);
    if (filterStr) {
        params.filter = filterStr;
    }

    if (pagination?.page !== undefined) {
        params.page = String(pagination.page);
    }
    if (pagination?.limit !== undefined) {
        params.limit = String(pagination.limit);
    }
    if (pagination?.sortBy) {
        params.sort_by = pagination.sortBy;
    }
    if (pagination?.sortDir) {
        params.sort_dir = pagination.sortDir;
    }

    return params;
}
