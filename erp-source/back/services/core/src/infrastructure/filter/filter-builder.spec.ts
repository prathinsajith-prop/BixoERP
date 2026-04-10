import { SelectQueryBuilder } from 'typeorm';
import { FilterBuilder, FilterFieldConfig, FilterApplicationResult } from './filter-builder';

// ─── Minimal SelectQueryBuilder mock ────────────────────────────────────────

/**
 * sql === 'BRACKETS' for OR groups; check `.inner` for the nested OR conditions.
 * inner[0].isOr === false (first is `where`), subsequent entries have isOr === true.
 */
type Condition = { sql: string; params: Record<string, unknown>; isOr?: boolean; inner?: Condition[] };

function makeQb(): { mock: SelectQueryBuilder<any>; conditions: Condition[]; orders: { col: string; dir: string }[] } {
    const conditions: Condition[] = [];
    const orders: { col: string; dir: string }[] = [];

    function makeInnerQb(innerConds: Condition[]) {
        return {
            where(sql: string, params: Record<string, unknown> = {}) {
                innerConds.push({ sql, params, isOr: false });
                return this;
            },
            orWhere(sql: string, params: Record<string, unknown> = {}) {
                innerConds.push({ sql, params, isOr: true });
                return this;
            },
        };
    }

    const mock = {
        andWhere(sqlOrBrackets: string | any, params: Record<string, unknown> = {}) {
            if (sqlOrBrackets && typeof sqlOrBrackets === 'object' && typeof sqlOrBrackets.whereFactory === 'function') {
                const innerConds: Condition[] = [];
                sqlOrBrackets.whereFactory(makeInnerQb(innerConds));
                conditions.push({ sql: 'BRACKETS', params: {}, inner: innerConds });
            } else {
                conditions.push({ sql: sqlOrBrackets as string, params });
            }
            return this;
        },
        addOrderBy(col: string, dir: string) {
            orders.push({ col, dir });
            return this;
        },
    } as unknown as SelectQueryBuilder<any>;
    return { mock, conditions, orders };
}

// ─── Shared field configs ────────────────────────────────────────────────────

const FIELDS: FilterFieldConfig[] = [
    {
        key: 'status',
        column: 'status',
        type: 'enum',
        // IN / NOT_IN are now supported for enum (matches real USER_FILTERS definition)
        operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
        allowedValues: ['ACTIVE', 'INACTIVE'],
    },
    {
        key: 'division',
        column: 'division_id',
        type: 'uuid',
        operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL'],
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
        key: 'tag',
        column: 'tag',
        type: 'text',
        operators: ['EQ', 'NEQ', 'LIKE', 'IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'age',
        column: 'age',
        type: 'number',
        operators: ['EQ', 'NEQ', 'GT', 'LT', 'GTE', 'LTE', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'created_at',
        column: 'created_at',
        type: 'date',
        operators: ['DATE_EQ', 'DATE_LT', 'DATE_GT', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
    },
    {
        key: 'active',
        column: 'is_active',
        type: 'boolean',
        operators: ['EQ', 'NEQ', 'IS_TRUE', 'IS_FALSE'],
    },
];

const VALID_UUID = '79a56ae2-14fe-4641-b950-609de0a3b2e6';
const VALID_UUID2 = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

// ─── FilterBuilder.for ────────────────────────────────────────────────────────

describe('FilterBuilder.for', () => {
    it('creates a builder with the provided fields', () => {
        const fb = FilterBuilder.for(FIELDS);
        expect(fb.supportedKeys).toEqual(['status', 'division', 'role', 'name', 'tag', 'age', 'created_at', 'active']);
    });

    it('returns a new instance each call', () => {
        const a = FilterBuilder.for(FIELDS);
        const b = FilterBuilder.for(FIELDS);
        expect(a).not.toBe(b);
    });
});

// ─── applySearch ─────────────────────────────────────────────────────────────

describe('applySearch', () => {
    it('adds LOWER...LIKE condition for each column (OR joined)', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applySearch(mock, 'o', 'hello', ['name', 'code']);

        expect(conditions).toHaveLength(1);
        expect(conditions[0].sql).toBe('(LOWER(o.name) LIKE :_fts OR LOWER(o.code) LIKE :_fts)');
        expect(conditions[0].params['_fts']).toBe('%hello%');
    });

    it('lowercases the search term', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applySearch(mock, 'o', 'UPPER', ['name']);
        expect(conditions[0].params['_fts']).toBe('%upper%');
    });

    it('does nothing when search is empty string', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applySearch(mock, 'o', '', ['name']);
        expect(conditions).toHaveLength(0);
    });

    it('does nothing when search is undefined', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applySearch(mock, 'o', undefined, ['name']);
        expect(conditions).toHaveLength(0);
    });

    it('does nothing when columns array is empty', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applySearch(mock, 'o', 'hello', []);
        expect(conditions).toHaveLength(0);
    });

    it('returns this for chaining', () => {
        const { mock } = makeQb();
        const fb = FilterBuilder.for(FIELDS);
        expect(fb.applySearch(mock, 'o', 'x', ['name'])).toBe(fb);
    });
});

// ─── applyFilters — enum ──────────────────────────────────────────────────────

describe('applyFilters — enum', () => {
    it('applies EQ condition for a valid enum value', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:EQ(ACTIVE)');

        expect(result.appliedKeys).toEqual(['status']);
        expect(result.rejectedFilters).toHaveLength(0);
        expect(conditions[0].sql).toBe('o.status = :_fp_status');
        expect(conditions[0].params['_fp_status']).toBe('ACTIVE');
    });

    it('applies NEQ condition', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:NEQ(INACTIVE)');
        expect(conditions[0].sql).toBe('o.status != :_fp_status');
    });

    it('uppercases the enum value before applying', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:EQ(active)');
        expect(conditions[0].params['_fp_status']).toBe('ACTIVE');
    });

    it('rejects an enum value not in allowedValues', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:EQ(PENDING)');

        expect(result.rejectedFilters).toHaveLength(1);
        expect(result.rejectedFilters[0].reason).toBe('invalid_enum_value');
        expect(conditions).toHaveLength(0);
    });

    it('rejects an operator not allowed for the field', () => {
        const { mock, conditions } = makeQb();
        // BETWEEN is not a permitted operator for enum fields
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:BETWEEN(ACTIVE,INACTIVE)');

        expect(result.rejectedFilters[0].reason).toBe('operator_not_allowed');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — uuid ──────────────────────────────────────────────────────

describe('applyFilters — uuid', () => {
    it('applies EQ condition for a single valid UUID', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', `division:EQ(${VALID_UUID})`);
        expect(conditions[0].sql).toBe('o.division_id = :_fp_division');
        expect(conditions[0].params['_fp_division']).toBe(VALID_UUID);
    });

    it('applies IN condition for multiple UUIDs', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', `division:IN(${VALID_UUID},${VALID_UUID2})`);
        expect(conditions[0].sql).toBe('o.division_id IN (:..._fp_division)');
        expect(conditions[0].params['_fp_division']).toEqual([VALID_UUID, VALID_UUID2]);
    });

    it('applies NOT_IN condition', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', `division:NOT_IN(${VALID_UUID})`);
        expect(conditions[0].sql).toBe('o.division_id NOT IN (:..._fp_division)');
    });

    it('rejects a malformed UUID', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'division:EQ(not-a-uuid)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_uuid');
        expect(conditions).toHaveLength(0);
    });

    it('rejects a mix of valid and invalid UUIDs in IN clause', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(
            mock,
            'o',
            `division:IN(${VALID_UUID},bad-uuid)`,
        );
        expect(result.rejectedFilters[0].reason).toBe('invalid_uuid');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — array_uuid ────────────────────────────────────────────────

describe('applyFilters — array_uuid', () => {
    it('applies && overlap operator for IN', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', `role:IN(${VALID_UUID})`);
        expect(conditions[0].sql).toContain('o.roles && ARRAY[');
        expect(conditions[0].sql).toContain('::uuid[]');
        expect(conditions[0].params['_fp_role0']).toBe(VALID_UUID);
    });

    it('negates overlap operator for NOT_IN', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', `role:NOT_IN(${VALID_UUID})`);
        expect(conditions[0].sql).toContain('NOT (o.roles && ARRAY[');
    });

    it('rejects an invalid UUID in array_uuid field', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'role:IN(bad-uuid)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_uuid');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — text ──────────────────────────────────────────────────────

describe('applyFilters — text', () => {
    it('applies LIKE condition with lowercase wrapping', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:LIKE(John)');
        expect(conditions[0].sql).toBe('LOWER(o.first_name) LIKE :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('%john%');
    });

    it('applies EQ condition for exact text match', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:EQ(John)');
        expect(conditions[0].sql).toBe('o.first_name = :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('John');
    });
});

// ─── applyFilters — unknown / malformed keys ──────────────────────────────────

describe('applyFilters — validation rejections', () => {
    it('rejects an unknown filter key', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'secret:EQ(x)');
        expect(result.rejectedFilters[0].key).toBe('secret');
        expect(result.rejectedFilters[0].reason).toBe('unknown_key');
        expect(conditions).toHaveLength(0);
    });

    it('rejects a malformed segment (no operator parentheses)', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status=ACTIVE');
        expect(result.rejectedFilters[0].reason).toBe('malformed_segment');
        expect(conditions).toHaveLength(0);
    });

    it('returns empty result for undefined filter string', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', undefined);
        expect(result.appliedKeys).toHaveLength(0);
        expect(result.rejectedFilters).toHaveLength(0);
        expect(conditions).toHaveLength(0);
    });

    it('returns empty result for empty filter string', () => {
        const { mock } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '');
        expect(result.appliedKeys).toHaveLength(0);
    });

    it('applies valid segments and rejects invalid ones in the same string', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(
            mock,
            'o',
            `status:EQ(ACTIVE);unknown:EQ(x);name:LIKE(alice)`,
        );

        expect(result.appliedKeys).toEqual(['status', 'name']);
        expect(result.rejectedFilters).toHaveLength(1);
        expect(result.rejectedFilters[0].key).toBe('unknown');
        expect(conditions).toHaveLength(2);
    });
});

// ─── validate (dry-run) ───────────────────────────────────────────────────────

describe('validate (dry-run, no query builder)', () => {
    it('returns applied and rejected keys without touching the query builder', () => {
        const fb = FilterBuilder.for(FIELDS);
        const result: FilterApplicationResult = fb.validate(
            `status:EQ(ACTIVE);unknown:EQ(x)`,
        );
        expect(result.appliedKeys).toContain('status');
        expect(result.rejectedFilters[0].key).toBe('unknown');
    });

    it('treats unknown_key and returns it in rejections', () => {
        const result = FilterBuilder.for(FIELDS).validate('sneaky:EQ(x)');
        expect(result.rejectedFilters[0].reason).toBe('unknown_key');
    });
});

// ─── Multiple segments ────────────────────────────────────────────────────────

describe('multiple filter segments', () => {
    it('applies multiple valid conditions', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(
            mock,
            'o',
            `status:EQ(ACTIVE);name:LIKE(alice)`,
        );
        expect(result.appliedKeys).toEqual(['status', 'name']);
        expect(conditions).toHaveLength(2);
    });

    it('applies the same field key twice in the AND chain (both conditions added)', () => {
        // Both conditions are added. Note: plain AND segments share the _fp_<key> param name
        // so the last write wins in TypeORM's merged param map — see class-level JSDoc note.
        // Use BETWEEN for date/number ranges or an OR group for multi-value same-field filters.
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:EQ(ACTIVE);status:NEQ(INACTIVE)');
        expect(conditions).toHaveLength(2);
    });
});

// ─── supportedKeys ────────────────────────────────────────────────────────────

describe('supportedKeys', () => {
    it('returns only the keys from the provided field config', () => {
        const limited: FilterFieldConfig[] = [
            { key: 'status', column: 'status', type: 'enum', operators: ['EQ'], allowedValues: ['ACTIVE'] },
        ];
        expect(FilterBuilder.for(limited).supportedKeys).toEqual(['status']);
    });
});

// ─── applyFilters — text extended operators ───────────────────────────────────

describe('applyFilters — text extended operators', () => {
    it('NOT_LIKE: wraps value in % % with NOT LIKE', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:NOT_LIKE(John)');
        expect(conditions[0].sql).toBe('LOWER(o.first_name) NOT LIKE :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('%john%');
    });

    it('STARTS_WITH: prefix match only (value%)', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:STARTS_WITH(Jo)');
        expect(conditions[0].sql).toBe('LOWER(o.first_name) LIKE :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('jo%');
    });

    it('ENDS_WITH: suffix match only (%value)', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:ENDS_WITH(hn)');
        expect(conditions[0].sql).toBe('LOWER(o.first_name) LIKE :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('%hn');
    });

    it('NEQ: exact not-equal match (case-sensitive)', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:NEQ(Alice)');
        expect(conditions[0].sql).toBe('o.first_name != :_fp_name');
        expect(conditions[0].params['_fp_name']).toBe('Alice');
    });

    it('IS_NULL on text column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:IS_NULL()');
        expect(conditions[0].sql).toBe('o.first_name IS NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_NULL on text column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'name:IS_NOT_NULL()');
        expect(conditions[0].sql).toBe('o.first_name IS NOT NULL');
        expect(conditions[0].params).toEqual({});
    });
});

// ─── applyFilters — number ────────────────────────────────────────────────────

describe('applyFilters — number', () => {
    it('EQ: exact numeric equality, coerces to number', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:EQ(30)');
        expect(conditions[0].sql).toBe('o.age = :_fp_age');
        expect(conditions[0].params['_fp_age']).toBe(30);
    });

    it('NEQ: numeric not-equal', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:NEQ(0)');
        expect(conditions[0].sql).toBe('o.age != :_fp_age');
        expect(conditions[0].params['_fp_age']).toBe(0);
    });

    it('GT (greater_than): > operator', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:GT(18)');
        expect(conditions[0].sql).toBe('o.age > :_fp_age');
        expect(conditions[0].params['_fp_age']).toBe(18);
    });

    it('LT (less_than): < operator', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:LT(65)');
        expect(conditions[0].sql).toBe('o.age < :_fp_age');
        expect(conditions[0].params['_fp_age']).toBe(65);
    });

    it('GTE (gte): >= operator', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:GTE(18)');
        expect(conditions[0].sql).toBe('o.age >= :_fp_age');
    });

    it('LTE (lte): <= operator', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:LTE(65)');
        expect(conditions[0].sql).toBe('o.age <= :_fp_age');
    });

    it('BETWEEN (between): BETWEEN min AND max with two named params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:BETWEEN(18,65)');
        expect(conditions[0].sql).toBe('o.age BETWEEN :_fp_ageMin AND :_fp_ageMax');
        expect(conditions[0].params['_fp_ageMin']).toBe(18);
        expect(conditions[0].params['_fp_ageMax']).toBe(65);
    });

    it('IS_NULL on number column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:IS_NULL()');
        expect(conditions[0].sql).toBe('o.age IS NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_NULL on number column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:IS_NOT_NULL()');
        expect(conditions[0].sql).toBe('o.age IS NOT NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('rejects a non-numeric value with invalid_number', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:GT(abc)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_number');
        expect(conditions).toHaveLength(0);
    });

    it('rejects BETWEEN with only one value with invalid_number', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'age:BETWEEN(18)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_number');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — date ──────────────────────────────────────────────────────

describe('applyFilters — date', () => {
    it('DATE_EQ (on): DATE(col) = :p', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:DATE_EQ(2024-01-15)');
        expect(conditions[0].sql).toBe('DATE(o.created_at) = :_fp_created_at');
        expect(conditions[0].params['_fp_created_at']).toBe('2024-01-15');
    });

    it('DATE_LT (before): col < :p', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:DATE_LT(2024-06-01)');
        expect(conditions[0].sql).toBe('o.created_at < :_fp_created_at');
        expect(conditions[0].params['_fp_created_at']).toBe('2024-06-01');
    });

    it('DATE_GT (after): col > :p', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:DATE_GT(2024-01-01)');
        expect(conditions[0].sql).toBe('o.created_at > :_fp_created_at');
        expect(conditions[0].params['_fp_created_at']).toBe('2024-01-01');
    });

    it('BETWEEN (date range): BETWEEN :from AND :to with two named params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:BETWEEN(2024-01-01,2024-12-31)');
        expect(conditions[0].sql).toBe('o.created_at BETWEEN :_fp_created_atFrom AND :_fp_created_atTo');
        expect(conditions[0].params['_fp_created_atFrom']).toBe('2024-01-01');
        expect(conditions[0].params['_fp_created_atTo']).toBe('2024-12-31');
    });

    it('IS_NULL on date column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:IS_NULL()');
        expect(conditions[0].sql).toBe('o.created_at IS NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_NULL on date column: no params emitted', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:IS_NOT_NULL()');
        expect(conditions[0].sql).toBe('o.created_at IS NOT NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('rejects an invalid date string with invalid_date', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:DATE_EQ(not-a-date)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_date');
        expect(conditions).toHaveLength(0);
    });

    it('rejects BETWEEN with only one date with invalid_date', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'created_at:BETWEEN(2024-01-01)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_date');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — IS_NULL / IS_NOT_NULL (cross-type) ───────────────────────

describe('applyFilters — IS_NULL / IS_NOT_NULL cross-type', () => {
    it('IS_NULL on enum column', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:IS_NULL()');
        expect(conditions[0].sql).toBe('o.status IS NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_NULL on enum column', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:IS_NOT_NULL()');
        expect(conditions[0].sql).toBe('o.status IS NOT NULL');
    });

    it('IS_NULL on uuid column', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'division:IS_NULL()');
        expect(conditions[0].sql).toBe('o.division_id IS NULL');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_NULL on uuid column', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'division:IS_NOT_NULL()');
        expect(conditions[0].sql).toBe('o.division_id IS NOT NULL');
    });
});

// ─── validate dry-run — extended ─────────────────────────────────────────────

describe('validate (dry-run) — extended operators', () => {
    it('validates number BETWEEN correctly', () => {
        const result = FilterBuilder.for(FIELDS).validate('age:BETWEEN(18,65)');
        expect(result.appliedKeys).toContain('age');
        expect(result.rejectedFilters).toHaveLength(0);
    });

    it('rejects invalid number BETWEEN (one value)', () => {
        const result = FilterBuilder.for(FIELDS).validate('age:BETWEEN(18)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_number');
    });

    it('validates date range correctly', () => {
        const result = FilterBuilder.for(FIELDS).validate('created_at:BETWEEN(2024-01-01,2024-12-31)');
        expect(result.appliedKeys).toContain('created_at');
        expect(result.rejectedFilters).toHaveLength(0);
    });

    it('rejects invalid date BETWEEN (one value)', () => {
        const result = FilterBuilder.for(FIELDS).validate('created_at:BETWEEN(2024-01-01)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_date');
    });

    it('IS_NULL is always valid for configured field', () => {
        const result = FilterBuilder.for(FIELDS).validate('age:IS_NULL()');
        expect(result.appliedKeys).toContain('age');
        expect(result.rejectedFilters).toHaveLength(0);
    });
});

// ─── applyFilters — enum IN / NOT_IN ─────────────────────────────────────────

describe('applyFilters — enum IN / NOT_IN', () => {
    it('IN: applies IN clause with uppercased values', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:IN(ACTIVE,INACTIVE)');
        expect(conditions[0].sql).toBe('o.status IN (:..._fp_status)');
        expect(conditions[0].params['_fp_status']).toEqual(['ACTIVE', 'INACTIVE']);
    });

    it('IN: uppercases lowercase input before applying', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:IN(active)');
        expect(conditions[0].params['_fp_status']).toEqual(['ACTIVE']);
    });

    it('NOT_IN: applies NOT IN clause', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:NOT_IN(INACTIVE)');
        expect(conditions[0].sql).toBe('o.status NOT IN (:..._fp_status)');
        expect(conditions[0].params['_fp_status']).toEqual(['INACTIVE']);
    });

    it('IN: rejects if any value is not in allowedValues', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'status:IN(ACTIVE,PENDING)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_enum_value');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — boolean ───────────────────────────────────────────────────

describe('applyFilters — boolean', () => {
    it('IS_TRUE: emits col = TRUE with no params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:IS_TRUE()');
        expect(conditions[0].sql).toBe('o.is_active = TRUE');
        expect(conditions[0].params).toEqual({});
    });

    it('IS_FALSE: emits col = FALSE with no params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:IS_FALSE()');
        expect(conditions[0].sql).toBe('o.is_active = FALSE');
        expect(conditions[0].params).toEqual({});
    });

    it('EQ(true): binds boolean true', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:EQ(true)');
        expect(conditions[0].sql).toBe('o.is_active = :_fp_active');
        expect(conditions[0].params['_fp_active']).toBe(true);
    });

    it('EQ(false): binds boolean false', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:EQ(false)');
        expect(conditions[0].params['_fp_active']).toBe(false);
    });

    it('NEQ(true): emits != with boolean true', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:NEQ(true)');
        expect(conditions[0].sql).toBe('o.is_active != :_fp_active');
        expect(conditions[0].params['_fp_active']).toBe(true);
    });

    it('EQ with non-boolean value: rejected with invalid_boolean', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:EQ(yes)');
        expect(result.rejectedFilters[0].reason).toBe('invalid_boolean');
        expect(conditions).toHaveLength(0);
    });

    it('operator not in config: rejected with operator_not_allowed', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'active:LIKE(true)');
        expect(result.rejectedFilters[0].reason).toBe('operator_not_allowed');
        expect(conditions).toHaveLength(0);
    });
});

// ─── applyFilters — text IS_EMPTY / IS_NOT_EMPTY ─────────────────────────────

describe('applyFilters — text IS_EMPTY / IS_NOT_EMPTY', () => {
    it('IS_EMPTY: emits NULL-or-empty check with no params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'tag:IS_EMPTY()');
        expect(conditions[0].sql).toBe("(o.tag IS NULL OR o.tag = '')");
        expect(conditions[0].params).toEqual({});
    });

    it('IS_NOT_EMPTY: emits NOT-NULL-and-not-empty check with no params', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'tag:IS_NOT_EMPTY()');
        expect(conditions[0].sql).toBe("(o.tag IS NOT NULL AND o.tag != '')");
        expect(conditions[0].params).toEqual({});
    });
});

// ─── applyFilters — text IN / NOT_IN ─────────────────────────────────────────

describe('applyFilters — text IN / NOT_IN', () => {
    it('IN: applies IN clause with raw string values (case-preserved)', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'tag:IN(alpha,beta,gamma)');
        expect(conditions[0].sql).toBe('o.tag IN (:..._fp_tag)');
        expect(conditions[0].params['_fp_tag']).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('NOT_IN: applies NOT IN clause', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', 'tag:NOT_IN(draft,archived)');
        expect(conditions[0].sql).toBe('o.tag NOT IN (:..._fp_tag)');
        expect(conditions[0].params['_fp_tag']).toEqual(['draft', 'archived']);
    });
});

// ─── applyFilters — OR groups ─────────────────────────────────────────────────

describe('applyFilters — OR groups', () => {
    it('wraps OR conditions in a single BRACKETS call', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|status:EQ(INACTIVE))');

        expect(conditions).toHaveLength(1);
        expect(conditions[0].sql).toBe('BRACKETS');
        expect(conditions[0].inner).toHaveLength(2);
    });

    it('OR group: first segment uses `where`, subsequent use `orWhere`', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|status:EQ(INACTIVE))');

        expect(conditions[0].inner![0].isOr).toBe(false);
        expect(conditions[0].inner![1].isOr).toBe(true);
    });

    it('OR group: each segment gets a unique param suffix preventing collisions', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|status:EQ(INACTIVE))');

        const inner = conditions[0].inner!;
        // Param keys must differ so both values reach the driver
        const keys0 = Object.keys(inner[0].params);
        const keys1 = Object.keys(inner[1].params);
        expect(keys0[0]).not.toBe(keys1[0]);
        expect(Object.values(inner[0].params)[0]).toBe('ACTIVE');
        expect(Object.values(inner[1].params)[0]).toBe('INACTIVE');
    });

    it('OR group combined with AND segment: two top-level conditions', () => {
        const { mock, conditions } = makeQb();
        FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|status:EQ(INACTIVE));name:LIKE(alice)');

        expect(conditions).toHaveLength(2);
        expect(conditions[0].sql).toBe('BRACKETS');
        expect(conditions[1].sql).toBe('LOWER(o.first_name) LIKE :_fp_name');
    });

    it('OR group with a malformed segment: malformed rejected, valid ones applied', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|badformat)');

        expect(result.rejectedFilters).toHaveLength(1);
        expect(result.rejectedFilters[0].reason).toBe('malformed_segment');
        // The valid segment still produces a BRACKETS condition with one inner condition
        expect(conditions).toHaveLength(1);
        expect(conditions[0].inner).toHaveLength(1);
    });

    it('OR group with all segments rejected: no andWhere call emitted', () => {
        const { mock, conditions } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(PENDING)|status:EQ(UNKNOWN))');

        expect(result.rejectedFilters).toHaveLength(2);
        expect(conditions).toHaveLength(0);
    });

    it('OR group reports applied keys for each accepted segment', () => {
        const { mock } = makeQb();
        const result = FilterBuilder.for(FIELDS).applyFilters(mock, 'o', '(status:EQ(ACTIVE)|name:LIKE(alice))');
        expect(result.appliedKeys).toEqual(['status', 'name']);
    });

    it('validate: recognises OR group syntax without a query builder', () => {
        const result = FilterBuilder.for(FIELDS).validate('(status:EQ(ACTIVE)|status:EQ(INACTIVE));name:LIKE(bob)');
        expect(result.appliedKeys).toEqual(['status', 'status', 'name']);
        expect(result.rejectedFilters).toHaveLength(0);
    });
});

// ─── applySort ────────────────────────────────────────────────────────────────

describe('applySort', () => {
    const ALLOWED = { name: 'first_name', created_at: 'created_at', age: 'age' };

    it('adds single ORDER BY ASC', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'name:ASC', ALLOWED);
        expect(orders).toHaveLength(1);
        expect(orders[0]).toEqual({ col: 'o.first_name', dir: 'ASC' });
    });

    it('adds single ORDER BY DESC', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'created_at:DESC', ALLOWED);
        expect(orders[0]).toEqual({ col: 'o.created_at', dir: 'DESC' });
    });

    it('case-insensitive direction: asc/desc normalised to uppercase', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'name:asc', ALLOWED);
        expect(orders[0].dir).toBe('ASC');
    });

    it('multi-column sort: adds ORDER BY for each segment in order', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'name:ASC;created_at:DESC', ALLOWED);
        expect(orders).toHaveLength(2);
        expect(orders[0]).toEqual({ col: 'o.first_name', dir: 'ASC' });
        expect(orders[1]).toEqual({ col: 'o.created_at', dir: 'DESC' });
    });

    it('skips unknown sort keys silently', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'secret:ASC;name:ASC', ALLOWED);
        expect(orders).toHaveLength(1);
        expect(orders[0].col).toBe('o.first_name');
    });

    it('skips malformed sort segments silently', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', 'name_ASC;age:DESC', ALLOWED);
        expect(orders).toHaveLength(1);
        expect(orders[0].col).toBe('o.age');
    });

    it('does nothing when sortStr is undefined', () => {
        const { mock, orders } = makeQb();
        FilterBuilder.for(FIELDS).applySort(mock, 'o', undefined, ALLOWED);
        expect(orders).toHaveLength(0);
    });

    it('returns this for chaining', () => {
        const { mock } = makeQb();
        const fb = FilterBuilder.for(FIELDS);
        expect(fb.applySort(mock, 'o', 'name:ASC', ALLOWED)).toBe(fb);
    });
});
