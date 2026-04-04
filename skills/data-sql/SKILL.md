---
name: data-sql
description: >-
  SQL query design, optimization, EXPLAIN analysis, index strategy, pagination,
  upserts, and N+1 prevention for relational databases (PostgreSQL, MySQL,
  SQL Server, SQLite, Oracle).
  USE FOR: SQL queries, schema review, performance tuning, index strategy,
  query optimization, EXPLAIN plan analysis.
  DO NOT USE FOR: GraphQL APIs (data-graphql), MongoDB queries (data-mongodb),
  Redis caching (data-redis), full backend implementation (impl-* skills).
argument-hint: 'Paste a query, point me at a schema, or describe what data you need.'
phase: '4'
phase-family: implementation
---

# SQL Query Design and Optimization

## When to Use

- Writing complex SQL queries (JOINs, CTEs, window functions, upserts).
- Reviewing existing SQL for correctness, performance, and security.
- Diagnosing slow queries via EXPLAIN plans.
- Designing or reviewing index strategy.
- Fixing N+1 query patterns in application code.
- Schema scanning and onboarding to a database.

## When Not to Use

- GraphQL schema design or resolvers — use `data-graphql`.
- MongoDB queries or aggregation pipelines — use `data-mongodb`.
- Redis caching, rate limiting, or pub/sub — use `data-redis`.
- Full backend feature implementation — use `impl-python`, `impl-typescript-backend`, or other `impl-*` skills.
- Architecture or planning decisions — use `architecture-planning`.

## Procedure

1. **Detect database** — Identify the RDBMS and version from project files (`package.json`, `prisma/schema.prisma`, `appsettings.json`, `settings.py`, `*.csproj`, connection strings). Supported: PostgreSQL, MySQL/MariaDB, SQL Server, SQLite, Oracle.
2. **Scan schema** — If a database project or schema definition exists (ORM models, migration files, `.sqlproj`), catalog tables, columns, types, constraints, indexes, and relationships. Produce a summary.
3. **Analyze the request** — Determine what is needed: write a query, review existing SQL, diagnose performance, or explain a schema.
4. **Write or optimize SQL** — Produce correct, performant SQL following the standards below. Adapt syntax to the detected dialect.
5. **Verify with EXPLAIN** — If executable, run `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN` (MySQL) to validate the plan and interpret results.
6. **Recommend indexes** — Suggest indexes that would improve performance for the queries at hand.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

### Database Coverage

Detect the target database from connection strings, ORM configuration, migration files, or database project files:

- **PostgreSQL** — `pg`, Prisma with `postgresql`, Django `psycopg2`, EF Core `Npgsql`
- **MySQL / MariaDB** — `mysql2`, Prisma with `mysql`, Django `mysqlclient`
- **SQL Server** — `mssql`, `.sqlproj`, `.dacpac`, EF Core `SqlServer`
- **SQLite** — `better-sqlite3`, Prisma with `sqlite`, Django `sqlite3`
- **Oracle** — `oracledb`, `cx_Oracle`

Adapt syntax, functions, and optimization strategies to the detected dialect.

### Schema Scanning Sources

**ORM / Schema sources:**
- Prisma: `schema.prisma` — models, fields, relations, indexes, enums
- TypeORM: entity decorators — `@Entity`, `@Column`, `@ManyToOne`, `@Index`
- Sequelize: model definitions — `define`, associations
- Django: `models.py` — `Model` classes, fields, `Meta`, `ForeignKey`
- EF Core: `DbContext`, entity configurations, migrations
- SQL Server projects: `.sqlproj`, `.sql` table/view/procedure definitions

**Migration sources:**
- `migrations/` folders (Prisma, TypeORM, Sequelize, Django, Alembic, Flyway, Liquibase)
- Raw `.sql` migration files

### Query Writing Patterns

#### SELECT with JOINs

```sql
SELECT
    o.id AS order_id,
    o.created_at,
    c.name AS customer_name,
    SUM(li.quantity * li.unit_price) AS order_total
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN line_items li ON li.order_id = o.id
WHERE o.status = 'completed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.id, o.created_at, c.name
HAVING SUM(li.quantity * li.unit_price) > 100
ORDER BY order_total DESC;
```

#### CTEs and Window Functions

```sql
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', created_at) AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month))
        / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100,
        2
    ) AS growth_pct
FROM monthly_sales
ORDER BY month;
```

#### Upsert (PostgreSQL)

```sql
INSERT INTO inventory (product_id, warehouse_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (product_id, warehouse_id)
DO UPDATE SET
    quantity = inventory.quantity + EXCLUDED.quantity,
    updated_at = NOW();
```

### EXPLAIN / Performance Diagnosis

Always use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN` (MySQL) to verify query performance:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

**Red flags in explain plans:**
- `Seq Scan` on large tables — missing index
- `Nested Loop` with high row estimates — consider hash or merge join
- `Sort` with high memory — add index to avoid sorting
- `Hash Join` with spills to disk — increase `work_mem` or reduce result set
- `Bitmap Heap Scan` with many recheck conditions — partial index may help

### Common Bottlenecks and Fixes

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| Missing index | Seq Scan on filtered column | `CREATE INDEX` on WHERE/JOIN columns |
| N+1 queries | Many small queries in a loop | Use JOINs or batch queries |
| Full table scan | No index used despite WHERE clause | Check column types match, add composite index |
| Lock contention | Queries waiting on locks | Reduce transaction scope, use `SKIP LOCKED` |
| Large result sets | Slow response, high memory | Add pagination (LIMIT/OFFSET or cursor) |
| Unoptimized subquery | Correlated subquery re-executes per row | Rewrite as JOIN or CTE |
| Missing statistics | Planner chooses bad plan | Run `ANALYZE` on the table |

### Index Strategy

- Index columns used in WHERE, JOIN ON, ORDER BY, GROUP BY.
- Use composite indexes for multi-column filters (leftmost prefix rule).
- Consider partial indexes for filtered subsets (`WHERE active = true`).
- Use covering indexes (INCLUDE) to avoid heap lookups.
- Avoid over-indexing — each index slows writes.

### N+1 Prevention

- Identify loops that issue one query per iteration.
- Replace with JOINs, subqueries, or batch `IN (...)` queries.
- When using ORMs, use eager loading (`include`, `prefetch_related`, `Include()`).

### Pagination

- **Offset-based:** `LIMIT $1 OFFSET $2` — simple but degrades on deep pages.
- **Cursor-based:** `WHERE id > $cursor ORDER BY id LIMIT $1` — stable performance at any depth.
- Always pair pagination with a deterministic ORDER BY.

### Transaction Scope

- Keep transactions as short as possible.
- Use appropriate isolation levels (READ COMMITTED for most OLTP, SERIALIZABLE only when required).
- Use `SKIP LOCKED` for queue-style processing to avoid contention.

### SQL Injection Prevention

- Always use parameterized queries (`$1`, `?`, `@param`). Never concatenate user input into SQL strings.
- Validate and sanitize inputs at the application layer before they reach the query.

### NULL Handling

- Use `COALESCE` or `NULLIF` for safe NULL comparisons.
- Remember: `NULL != NULL` — use `IS NULL` / `IS NOT NULL`.
- Aggregations ignore NULLs — use `COALESCE` in SUM/AVG when zero-default is needed.
- Be cautious with `NOT IN` containing NULLs — prefer `NOT EXISTS`.

### Query Review Checklist

- [ ] **Correctness** — Does the query return the right results? Check JOIN conditions, WHERE filters, GROUP BY columns
- [ ] **SQL injection** — Are user inputs parameterized? Never concatenate strings into queries
- [ ] **Performance** — Are appropriate indexes used? Run EXPLAIN to verify
- [ ] **N+1 patterns** — Is the query called in a loop? Batch or join instead
- [ ] **NULL handling** — Are NULLs handled correctly in comparisons and aggregations?
- [ ] **Data types** — Do comparisons use matching types? Implicit casts defeat indexes
- [ ] **Transaction scope** — Is the transaction as short as possible? Are isolation levels appropriate?
- [ ] **Idempotency** — Can the query be safely retried? Use upserts where appropriate

## Output Contract

All skills in the **implementation** phase family use this identical report. Present it in chat before logging progress.

```markdown
### Implementation Complete Report

**Implementation summary**
[2-4 sentences: what was delivered and how it matches the request.]

**Scope**
- In scope: [bullets or "As specified in task"]
- Out of scope / deferred: [bullets or "None"]

**Acceptance criteria mapping**
| AC / criterion | Evidence |
|----------------|----------|
| [AC-1 or description] | [file path, test name, or behavior] |

_Use `N/A — [reason]` if no formal AC list exists._

**Changes**
| Path | Purpose |
|------|---------|
| `path/to/file` | [one line] |

**Verification**
- [command] — [result: pass/fail/skip]
- _If not run, state why._

**Risks and follow-ups**
- [concrete items] or **None**

**Suggested next step**
[Handoff target agent name or human action.]
```

## Guardrails

- Adapt all SQL syntax to the detected database dialect. Do not assume PostgreSQL when the project uses MySQL or SQL Server.
- Do not introduce schema changes unless explicitly requested — focus on queries and indexes.
- Do not speculate on missing schema; scan the project or ask for clarification.
- Use `data-graphql` when the task involves GraphQL schema or resolvers.
- Use `data-mongodb` when the task involves MongoDB queries or aggregation.
- Use `data-redis` when the task involves Redis caching or data structures.
- Use `impl-*` skills when the task requires full backend feature implementation beyond SQL.
