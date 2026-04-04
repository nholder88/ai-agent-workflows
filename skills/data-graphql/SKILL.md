---
name: data-graphql
description: >-
  GraphQL schema design, resolver architecture, DataLoader batching, Relay-style
  pagination, auth patterns, federation, and query complexity management.
  USE FOR: GraphQL schema design, resolvers, N+1 problems, pagination,
  federation, query optimization.
  DO NOT USE FOR: SQL queries (data-sql), MongoDB queries (data-mongodb),
  Redis caching (data-redis), full backend implementation (impl-* skills).
argument-hint: 'Paste a schema or query, point me at resolvers, or describe the API you need.'
phase: '4'
phase-family: implementation
---

# GraphQL Schema Design and Optimization

## When to Use

- Designing GraphQL schemas (types, inputs, enums, interfaces, unions).
- Writing or reviewing resolvers, mutations, and subscriptions.
- Fixing N+1 problems with DataLoader.
- Implementing Relay-style cursor pagination.
- Adding auth patterns (directive-based or context-based).
- Setting up Apollo Federation or schema stitching.
- Adding query depth and complexity limits.

## When Not to Use

- SQL query design or optimization — use `data-sql`.
- MongoDB queries or aggregation — use `data-mongodb`.
- Redis caching or data structures — use `data-redis`.
- Full backend feature implementation — use `impl-*` skills.
- Architecture or planning decisions — use `architecture-planning`.

## Procedure

1. **Detect GraphQL setup** — Identify the framework (Apollo Server, NestJS GraphQL, type-graphql, Yoga/Envelop, Strawberry, gqlgen, Hot Chocolate, Spring GraphQL), schema approach (schema-first vs code-first), and client libraries from project files.
2. **Scan schema** — If `.graphql` files or code-first type definitions exist, catalog all types, fields, queries, mutations, subscriptions, custom scalars, and directives.
3. **Scan resolvers** — Identify resolver implementations, data sources, and DataLoader usage.
4. **Analyze the request** — Determine what is needed: design a schema, write queries, review existing code, or diagnose performance.
5. **Produce output** — Write or optimize the schema/queries/resolvers, explain the reasoning, and flag concerns.
6. **Verify** — If executable, test queries against the schema and validate resolver behavior.
7. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

### Framework Detection

Detect the GraphQL framework from project files:

- **Apollo Server** — `@apollo/server`, `apollo-server-express` in `package.json`
- **NestJS GraphQL** — `@nestjs/graphql` in `package.json`
- **type-graphql** — `type-graphql` in `package.json`
- **Yoga / Envelop** — `graphql-yoga`, `@envelop/core` in `package.json`
- **Strawberry (Python)** — `strawberry-graphql` in `requirements.txt`
- **gqlgen (Go)** — `github.com/99designs/gqlgen` in `go.mod`
- **Hot Chocolate (.NET)** — `HotChocolate.AspNetCore` in `*.csproj`
- **Spring GraphQL (Java)** — `spring-boot-starter-graphql` in `pom.xml`

Adapt examples and patterns to the detected framework.

### Schema Scanning Sources

**Schema-first (`.graphql` files):**
- Type definitions, input types, enums, interfaces, unions
- Query, Mutation, Subscription root types
- Custom directives and scalars
- Federation entities (`@key`, `@external`, `@requires`)

**Code-first (decorators/classes):**
- `@ObjectType`, `@Field`, `@Resolver`, `@Query`, `@Mutation` (type-graphql / NestJS)
- `strawberry.type`, `strawberry.field` (Strawberry)
- Generated schema from `gqlgen.yml` (gqlgen)

### Schema Design Patterns

#### Type Definitions

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  posts(first: Int, after: String): PostConnection!
  createdAt: DateTime!
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  tags: [Tag!]!
  status: PostStatus!
  publishedAt: DateTime
}
```

#### Input Types and Mutations

```graphql
input CreatePostInput {
  title: String!
  content: String!
  tagIds: [ID!]
}

input UpdatePostInput {
  title: String
  content: String
  tagIds: [ID!]
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
  updatePost(id: ID!, input: UpdatePostInput!): UpdatePostPayload!
  deletePost(id: ID!): DeletePostPayload!
}
```

#### Error Handling with Payload Types

```graphql
type CreatePostPayload {
  post: Post
  errors: [UserError!]!
}

type UserError {
  field: String
  message: String!
}
```

Mutations return payload types with error fields rather than throwing. This gives clients structured error information.

#### Relay-Style Cursor Pagination

```graphql
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  posts(first: Int, after: String, last: Int, before: String): PostConnection!
}
```

### Query Patterns

#### Client Query with Fragments

```graphql
fragment UserBasic on User {
  id
  name
  email
}

query GetPostWithAuthor($id: ID!) {
  post(id: $id) {
    id
    title
    content
    author {
      ...UserBasic
    }
    tags {
      id
      name
    }
  }
}
```

#### Mutation with Error Handling

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
    }
    errors {
      field
      message
    }
  }
}
```

### DataLoader / N+1 Prevention

The most common GraphQL performance issue. When resolving a list, each item triggers a separate database query for related data.

**Symptom:** Resolving `posts { author { name } }` executes 1 query for posts + N queries for authors.

**Fix:** Use DataLoader to batch and deduplicate:

```typescript
const authorLoader = new DataLoader(async (authorIds: string[]) => {
  const authors = await db.users.findMany({
    where: { id: { in: authorIds } }
  });
  const authorMap = new Map(authors.map(a => [a.id, a]));
  return authorIds.map(id => authorMap.get(id));
});

const resolvers = {
  Post: {
    author: (post) => authorLoader.load(post.authorId)
  }
};
```

### Query Complexity and Depth Limits

Prevent abusive queries that could overwhelm the server:

```typescript
const server = new ApolloServer({
  validationRules: [
    depthLimit(10),
    createComplexityLimitRule(1000)
  ]
});
```

### Common Bottlenecks and Fixes

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| N+1 queries | Slow list resolvers, many DB queries | DataLoader for batching |
| Over-fetching | Resolver fetches full objects when few fields needed | Field-level resolvers, select only requested fields |
| No depth limit | Deeply nested queries crash server | Add depth limit validation rule |
| No complexity limit | Wide queries consume excessive resources | Add complexity scoring |
| Missing caching | Repeated identical queries | Response caching, CDN, persisted queries |
| Large payloads | Slow response for paginated lists | Cursor-based pagination, field limiting |
| Resolver waterfalls | Sequential data fetching | Parallelize independent resolvers |

### Auth Patterns in Resolvers

#### Directive-Based

```graphql
directive @auth(requires: UserRole!) on FIELD_DEFINITION

type Mutation {
  deleteUser(id: ID!): DeleteUserPayload! @auth(requires: ADMIN)
}
```

#### Context-Based

```typescript
const resolvers = {
  Mutation: {
    deleteUser: (_, { id }, context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }
      return deleteUser(id);
    }
  }
};
```

### Federation and Schema Stitching

#### Apollo Federation

```graphql
# Users service
type User @key(fields: "id") {
  id: ID!
  email: String!
  name: String!
}

# Posts service
type Post @key(fields: "id") {
  id: ID!
  title: String!
  author: User!
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post!]!
}
```

**When to federate:**
- Multiple teams own different parts of the graph.
- Services need independent deployment.
- Schema is large enough that a monolithic approach is unwieldy.

### Schema Review Checklist

- [ ] **Naming conventions** — Consistent casing (camelCase fields, PascalCase types)
- [ ] **Nullability** — Fields that should never be null are marked with `!`
- [ ] **Input validation** — Inputs validated before processing, custom scalars for emails/URLs
- [ ] **Error handling** — Mutations return payload types with error fields, not just throwing
- [ ] **Pagination** — Lists use cursor-based or offset pagination, not unbounded arrays
- [ ] **N+1 prevention** — DataLoaders in place for all relationship resolvers
- [ ] **Auth/authz** — Every mutation and sensitive query has authorization checks
- [ ] **Depth/complexity limits** — Validation rules prevent abusive queries
- [ ] **Deprecation** — Old fields marked `@deprecated(reason: "...")` not just removed
- [ ] **Documentation** — Types and fields have descriptions in the schema

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

- Adapt all examples to the detected GraphQL framework. Do not assume Apollo Server when the project uses Strawberry or gqlgen.
- Do not change schema in breaking ways without flagging — use `@deprecated` for field removal.
- Do not design REST endpoints — this skill is GraphQL-only.
- Use `data-sql` when the task is about the underlying SQL queries behind resolvers.
- Use `data-mongodb` when the data source is MongoDB.
- Use `data-redis` when caching layer design is needed.
- Use `impl-*` skills when the task requires full backend feature implementation beyond GraphQL.
