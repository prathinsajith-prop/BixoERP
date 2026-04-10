import { FilterFieldConfig } from './filter-builder';

/**
 * Centralized registry of all entity filter-field configurations.
 *
 * Adding a new filter to an entity means updating **only this file**.
 * Every repository automatically picks up the change via `FilterBuilder.for(...)`.
 *
 * Field-config shape:
 *   key          – the token that appears in the query string (e.g. `status`)
 *   column       – the actual ORM/DB column name on the entity alias
 *   type         – how the value is treated: 'enum' | 'uuid' | 'array_uuid' | 'text' | 'number' | 'date' | 'boolean'
 *   operators    – which operators are accepted for this field
 *   allowedValues – (enum only) the exact values that pass validation
 *
 * Supported operators by type:
 *   enum       → EQ, NEQ, IN, NOT_IN, IS_NULL, IS_NOT_NULL
 *   uuid       → EQ, NEQ, IN, NOT_IN, IS_NULL, IS_NOT_NULL
 *   array_uuid → IN, NOT_IN
 *   text       → EQ, NEQ, LIKE, NOT_LIKE, STARTS_WITH, ENDS_WITH, IN, NOT_IN, IS_EMPTY, IS_NOT_EMPTY, IS_NULL, IS_NOT_NULL
 *   number     → EQ, NEQ, GT, LT, GTE, LTE, BETWEEN, IS_NULL, IS_NOT_NULL
 *   date       → DATE_EQ, DATE_LT, DATE_GT, BETWEEN, IS_NULL, IS_NOT_NULL
 *   boolean    → EQ, NEQ, IS_TRUE, IS_FALSE
 *
 * OR-group filter syntax (e.g. status:EQ(ACTIVE) OR status:EQ(PENDING)):
 *   Pass `(status:EQ(ACTIVE)|status:EQ(PENDING))` in the filter string.
 *   Multiple groups / plain conditions are AND-joined with `;`.
 *
 * Sort string syntax (for applySort):
 *   `field:ASC` or `field:DESC`, semicolon-separated for multi-column sort.
 */

// ─── Users ────────────────────────────────────────────────────────────────────

export const USER_FILTERS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'role',
        column: 'roles',
        type: 'array_uuid',
        operators: ['IN', 'NOT_IN'],
    },
    {
        key: 'name',
        column: 'first_name',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'email',
        column: 'email',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
];

/** Columns full-text search spans for User. */
export const USER_SEARCH_COLUMNS = ['first_name', 'last_name', 'email'];

// ─── Divisions ────────────────────────────────────────────────────────────────

export const DIVISION_FILTERS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        operators: ['EQ', 'NEQ', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'name',
        column: 'name',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'code',
        column: 'code',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'STARTS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'head',
        column: 'head_user_id',
        type: 'uuid',
        operators: ['EQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
];

/** Columns full-text search spans for Division. */
export const DIVISION_SEARCH_COLUMNS = ['name', 'code'];

// ─── Departments ──────────────────────────────────────────────────────────────

export const DEPARTMENT_FILTERS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        operators: ['EQ', 'NEQ', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'name',
        column: 'name',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'code',
        column: 'code',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'STARTS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'division',
        column: 'division_id',
        type: 'uuid',
        operators: ['EQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'head',
        column: 'head_user_id',
        type: 'uuid',
        operators: ['EQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
];

/** Columns full-text search spans for Department. */
export const DEPARTMENT_SEARCH_COLUMNS = ['name', 'code'];

// ─── Teams ────────────────────────────────────────────────────────────────────

export const TEAM_FILTERS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        operators: ['EQ', 'NEQ', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'name',
        column: 'name',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'code',
        column: 'code',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'STARTS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'department',
        column: 'department_id',
        type: 'uuid',
        operators: ['EQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'lead',
        column: 'lead_user_id',
        type: 'uuid',
        operators: ['EQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
];

/** Columns full-text search spans for Team. */
export const TEAM_SEARCH_COLUMNS = ['name', 'code'];

// ─── Organizations ────────────────────────────────────────────────────────────

export const ORGANIZATION_FILTERS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'name',
        column: 'name',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'slug',
        column: 'slug',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'STARTS_WITH', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
];

/** Columns full-text search spans for Organization. */
export const ORGANIZATION_SEARCH_COLUMNS = ['name', 'slug'];
