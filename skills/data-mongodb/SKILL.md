---
name: data-mongodb
description: >-
  MongoDB schema design, aggregation pipelines, index strategy, TTL indexes,
  explain plan analysis, and performance diagnosis for document databases.
  USE FOR: MongoDB queries, aggregation pipelines, schema design (embed vs
  reference), index strategy, performance tuning.
  DO NOT USE FOR: SQL queries (data-sql), GraphQL APIs (data-graphql),
  Redis caching (data-redis), full backend implementation (impl-* skills).
argument-hint: 'Paste a query, point me at a schema, or describe what data you need from MongoDB.'
phase: '4'
phase-family: implementation
---

# MongoDB Schema Design and Query Optimization

## When to Use

- Writing MongoDB queries, aggregation pipelines, or update operations.
- Designing document schemas (embed vs reference decisions).
- Reviewing existing MongoDB operations for correctness and performance.
- Diagnosing slow operations via explain plans (COLLSCAN detection).
- Designing index strategy (compound, partial, TTL, text, wildcard).
- Fixing N+1 lookup patterns in application code.
- Bulk write operations and array manipulation.

## When Not to Use

- SQL queries or relational database work — use `data-sql`.
- GraphQL schema design or resolvers — use `data-graphql`.
- Redis caching or data structures — use `data-redis`.
- Full backend feature implementation — use `impl-*` skills.
- Architecture or planning decisions — use `architecture-planning`.

## Procedure

1. **Detect MongoDB usage** — Identify the MongoDB driver and ODM from project files (`package.json` for `mongoose` or `mongodb`, `prisma/schema.prisma` with `mongodb`, `requirements.txt` for `pymongo` or `motor`, `go.mod` for `go.mongodb.org/mongo-driver`).
2. **Scan schema** — If Mongoose models, Prisma schema, or native validation schemas exist, catalog collections, fields, validators, indexes, and references. Produce a summary of document shapes and relationships.
3. **Analyze the request** — Determine what is needed: write a query, review existing operations, diagnose performance, or design a schema.
4. **Write or optimize operations** — Produce correct, performant MongoDB operations following the standards below.
5. **Verify with explain** — If executable, run `.explain("executionStats")` to validate performance and interpret results.
6. **Recommend indexes** — Suggest indexes that would improve performance.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

### Schema Scanning Sources

**Mongoose models:**
- Schema definitions with field types, required flags, defaults, validators
- Indexes defined via `schema.index()` or field-level `index: true`
- References (`ref`) and virtual populations
- Discriminators and subdocuments

**Prisma with MongoDB:**
- Models with `@db.ObjectId`, embedded types, relations
- Unique constraints, indexes

**Native validation schemas:**
- `$jsonSchema` validators on collections
- `createIndex` definitions

### Schema Design — Embed vs Reference

| Factor | Embed | Reference |
|--------|-------|-----------|
| Read pattern | Data always read together | Data read independently |
| Write pattern | Low update frequency | Frequently updated subdocument |
| Size | Subdocument is small and bounded | Subdocument can grow unboundedly |
| Cardinality | One-to-few | One-to-many or many-to-many |
| Atomicity | Need atomic updates on parent+child | Independent lifecycle |

### Common Schema Patterns

- **Subset pattern** — Embed most-accessed fields, reference the rest.
- **Bucket pattern** — Group time-series data into bucketed documents.
- **Computed pattern** — Pre-compute aggregates on write to avoid expensive reads.
- **Schema versioning** — Include a `schemaVersion` field for migrations.
- **Polymorphic pattern** — Use a `type` discriminator field for varied document shapes in the same collection.

### Query Patterns

#### Find with Projection and Sort

```javascript
db.orders.find(
  {
    status: "completed",
    createdAt: { $gte: new Date("2024-01-01") }
  },
  {
    _id: 1,
    customerId: 1,
    total: 1,
    createdAt: 1
  }
).sort({ createdAt: -1 }).limit(50);
```

#### Aggregation Pipeline

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      revenue: { $sum: "$total" },
      count: { $sum: 1 }
  }},
  { $sort: { _id: 1 } },
  { $addFields: {
      month: "$_id",
      avgOrderValue: { $divide: ["$revenue", "$count"] }
  }},
  { $project: { _id: 0 } }
]);
```

#### Update with Array Operations

```javascript
db.users.updateOne(
  { _id: userId, "cart.productId": { $ne: productId } },
  {
    $push: { cart: { productId, quantity: 1, addedAt: new Date() } },
    $set: { updatedAt: new Date() }
  }
);
```

#### Bulk Write

```javascript
db.inventory.bulkWrite([
  { updateOne: {
      filter: { sku: "ABC123" },
      update: { $inc: { quantity: -1 } }
  }},
  { updateOne: {
      filter: { sku: "DEF456" },
      update: { $inc: { quantity: -3 } }
  }}
], { ordered: false });
```

### EXPLAIN / Performance Diagnosis

```javascript
db.orders.find({ customerId: "abc" }).explain("executionStats");
```

**Red flags in explain output:**
- `COLLSCAN` — Full collection scan, missing index
- `totalDocsExamined` >> `nReturned` — Index not selective enough
- `executionTimeMillis` high — Query needs optimization
- `SORT_KEY_GENERATOR` in plan — In-memory sort, add index for sort fields
- `FETCH` after `IXSCAN` — Index doesn't cover all projected fields

### Index Strategy

- Index fields used in `$match`, `$sort`, and `$lookup` foreign keys.
- Use compound indexes matching query patterns (equality-sort-range order).
- Use partial indexes for filtered subsets (`{ partialFilterExpression: { active: true } }`).
- Use TTL indexes for auto-expiring documents (sessions, logs).
- Use text indexes for full-text search, or Atlas Search for advanced needs.
- Use wildcard indexes sparingly for dynamic field patterns.
- Avoid over-indexing — each index consumes memory and slows writes.

### N+1 Prevention

- Identify loops that issue one `findOne` call per iteration.
- Replace with `$lookup` in aggregation pipelines or batch `$in` queries.
- Use Mongoose `.populate()` or Prisma `include` for eager loading.

### Projections

- Always project only needed fields to reduce network transfer and memory.
- Use `{ field: 1 }` inclusion or `{ field: 0 }` exclusion — do not mix (except `_id`).

### Common Bottlenecks and Fixes

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| Missing index | COLLSCAN on filtered field | `createIndex` on query fields |
| Unbounded arrays | Document exceeds 16MB | Bucket pattern or reference |
| N+1 lookups | Many `findOne` calls in a loop | Use `$lookup` or batch `$in` |
| Large pipeline | Slow aggregation | Add `$match` early, use indexes |
| No projection | Returning full documents when subset needed | Add projection to limit fields |
| Write amplification | Frequent updates to large embedded arrays | Reference instead of embed |

### Query Review Checklist

- [ ] **Correctness** — Does the query/pipeline return the right results?
- [ ] **Index usage** — Run `.explain()` to verify index is used
- [ ] **Injection** — Are user inputs sanitized? Watch for `$where` and `$regex` from user input
- [ ] **Projection** — Are only needed fields returned?
- [ ] **Array growth** — Can embedded arrays grow unboundedly?
- [ ] **Write concern** — Is the write concern appropriate for data criticality?
- [ ] **Read preference** — Is `secondaryPreferred` safe for this query's consistency needs?
- [ ] **Error handling** — Are duplicate key errors, write errors, and timeouts handled?

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

- Adapt all operations to the detected MongoDB driver and ODM (Mongoose, Prisma, pymongo, motor, Go driver).
- Do not assume Mongoose when the project uses the native MongoDB driver or Prisma.
- Do not introduce schema changes unless explicitly requested — focus on queries and indexes.
- Watch for the 16MB document size limit when embedding.
- Use `data-sql` when the task involves relational databases.
- Use `data-graphql` when the task involves GraphQL schema or resolvers.
- Use `data-redis` when the task involves Redis caching or data structures.
- Use `impl-*` skills when the task requires full backend feature implementation beyond MongoDB.
