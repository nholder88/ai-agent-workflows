---
name: data-query-specialists
description: 'Design, review, and optimize queries, schemas, and data-access patterns. USE FOR: SQL queries, joins, indexes, execution plans, GraphQL schemas, resolvers, N+1 problems, MongoDB aggregation pipelines, document design, Redis key patterns, caching strategies, TTL, performance diagnostics, slow query analysis. DO NOT USE FOR: application business logic, API design, frontend state management.'
argument-hint: 'Paste a query, point me at schema or resolver code, or describe the data-access problem.'
---

# Data Query Specialists

## When to Use

- A task focuses on relational SQL, GraphQL, MongoDB, or Redis behavior.
- Query performance, schema shape, caching, or N+1 problems are the main concern.
- A repository needs schema scanning and data-access review before deeper implementation.

## Procedure

1. Detect the engine or API style from manifests, schema files, ORMs, and client libraries.
2. Scan the data model, collections, tables, types, indexes, keys, or resolvers already present.
3. Write or review the query, resolver, pipeline, command set, or caching pattern.
4. Explain correctness, constraints, and performance trade-offs.
5. Validate with the engine-appropriate diagnostics where possible: EXPLAIN, execution stats, complexity rules, slow logs, or loader analysis.

## Engine Focus Areas

- SQL: joins, indexes, plans, transactions, parameterization, and dialect behavior.
- GraphQL: schema shape, nullability, pagination, authorization, DataLoader, and query complexity.
- MongoDB: document shape, embedding vs referencing, pipelines, explain stats, and indexes.
- Redis: key naming, TTL strategy, data-structure choice, hot keys, stampede prevention, and memory behavior.

## Guardrails

- Always call out injection risks and unbounded queries.
- Distinguish correctness problems from performance recommendations.
- Suggest indexes or loader patterns only when they align with actual query behavior.
