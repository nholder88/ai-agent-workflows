---
name: data-redis
description: >-
  Redis data structures, caching patterns (cache-aside, write-through), rate
  limiting, distributed locks, pub/sub, key naming conventions, TTL strategy,
  and SLOWLOG/MEMORY performance diagnosis.
  USE FOR: Redis caching, data structures, rate limiting, distributed locks,
  pub/sub, session management, key schema design.
  DO NOT USE FOR: SQL queries (data-sql), GraphQL APIs (data-graphql),
  MongoDB queries (data-mongodb), full backend implementation (impl-* skills).
argument-hint: 'Describe your caching need, paste Redis commands, or point me at Redis client code to review.'
phase: '4'
phase-family: implementation
---

# Redis Data Structures and Caching Patterns

## When to Use

- Implementing caching patterns (cache-aside, write-through, invalidation).
- Selecting Redis data structures for a use case.
- Designing rate limiting (sliding window, fixed window).
- Implementing distributed locks.
- Setting up pub/sub messaging.
- Designing key naming conventions and TTL strategy.
- Diagnosing performance via SLOWLOG and MEMORY commands.
- Reviewing existing Redis client code for correctness.

## When Not to Use

- SQL queries or relational database work — use `data-sql`.
- GraphQL schema design or resolvers — use `data-graphql`.
- MongoDB queries or aggregation — use `data-mongodb`.
- Full backend feature implementation — use `impl-*` skills.
- Architecture or planning decisions — use `architecture-planning`.

## Procedure

1. **Detect Redis usage** — Identify the client library and connection configuration from project files (`package.json` for `ioredis`/`redis`/`bullmq`, `requirements.txt` for `redis-py`/`aioredis`/`celery`, `*.csproj` for `StackExchange.Redis`, `go.mod` for `go-redis`, `pom.xml` for `Jedis`/`Lettuce`).
2. **Scan implementation** — Search the codebase for Redis client usage patterns, key naming, TTLs, and data structures used.
3. **Analyze the request** — Determine what is needed: implement a caching pattern, review existing Redis code, diagnose performance, or design a key schema.
4. **Produce output** — Write or optimize the implementation, explain the reasoning, and flag concerns.
5. **Verify** — If a Redis instance is accessible, verify with `MONITOR`, `SLOWLOG`, or `INFO` commands.
6. **Produce the output contract** — Write the Implementation Complete Report (see Output Contract below).

## Standards

### Client Detection

Detect the Redis client from project files:

- **Node.js:** `ioredis`, `redis` (node-redis), `bullmq` (queues)
- **Python:** `redis-py`, `aioredis`, `celery` (task queues)
- **C# / .NET:** `StackExchange.Redis`, `Microsoft.Extensions.Caching.StackExchangeRedis`
- **Go:** `go-redis`, `redigo`
- **Java:** `Jedis`, `Lettuce`, `Spring Data Redis`

Adapt examples and patterns to the detected client library.

### Data Structure Selection

| Use Case | Data Structure | Key Pattern | Commands |
|----------|---------------|-------------|----------|
| Simple cache | String | `cache:{entity}:{id}` | `GET`, `SET`, `SETEX` |
| Object cache | Hash | `user:{id}` | `HGET`, `HSET`, `HGETALL` |
| Queue / FIFO | List | `queue:{name}` | `LPUSH`, `BRPOP` |
| Unique collection | Set | `tags:{articleId}` | `SADD`, `SMEMBERS`, `SINTER` |
| Leaderboard | Sorted Set | `leaderboard:{game}` | `ZADD`, `ZREVRANGE`, `ZRANK` |
| Event stream | Stream | `events:{topic}` | `XADD`, `XREAD`, `XREADGROUP` |
| Rate limiter | String + INCR | `ratelimit:{ip}:{window}` | `INCR`, `EXPIRE` |
| Session | Hash | `session:{token}` | `HSET`, `HGETALL`, `EXPIRE` |
| Bloom filter | Module | `bloom:{name}` | `BF.ADD`, `BF.EXISTS` |

### Caching Patterns

#### Cache-Aside (Lazy Loading)

```typescript
async function getUser(id: string): Promise<User> {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  if (user) {
    await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  }
  return user;
}
```

#### Write-Through

```typescript
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const user = await db.users.update(id, data);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

#### Cache Invalidation

```typescript
async function deleteUser(id: string): Promise<void> {
  await db.users.delete(id);
  await redis.del(`user:${id}`);
  await redis.del(`user:${id}:permissions`);
}
```

### Rate Limiting (Sliding Window)

```typescript
async function isRateLimited(ip: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowStart = now - windowSec * 1000;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, now, `${now}`);
  pipeline.zcard(key);
  pipeline.expire(key, windowSec);
  const results = await pipeline.exec();

  const count = results[2][1] as number;
  return count > limit;
}
```

### Distributed Lock

```typescript
async function acquireLock(resource: string, ttlMs: number): Promise<string | null> {
  const token = crypto.randomUUID();
  const acquired = await redis.set(
    `lock:${resource}`, token, "PX", ttlMs, "NX"
  );
  return acquired ? token : null;
}

async function releaseLock(resource: string, token: string): Promise<boolean> {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await redis.eval(script, 1, `lock:${resource}`, token);
  return result === 1;
}
```

### Pub/Sub

```typescript
const subscriber = redis.duplicate();
await subscriber.subscribe("notifications");
subscriber.on("message", (channel, message) => {
  const payload = JSON.parse(message);
  handleNotification(payload);
});

await redis.publish("notifications", JSON.stringify({ userId: "123", type: "alert" }));
```

### Key Naming Conventions

- Use colons as separators: `entity:id:field` (e.g., `user:123:profile`).
- Prefix by application or service: `myapp:user:123`.
- Include version for cache busting: `v2:user:123`.
- Keep keys short but readable — Redis stores keys in memory.
- Document key patterns in a central location.

### TTL Strategy

| Data Type | Suggested TTL | Rationale |
|-----------|--------------|-----------|
| Session | 30m - 24h | Security, memory management |
| API cache | 5m - 1h | Freshness vs load reduction |
| User profile | 1h - 24h | Infrequently changing data |
| Rate limit window | Match window size | Auto-cleanup |
| Temporary lock | 5s - 30s | Prevent deadlocks |
| Feature flags | 5m - 15m | Quick propagation of changes |

### SLOWLOG / MEMORY Diagnosis

#### Slow Log Analysis

```
SLOWLOG GET 10           -- Get last 10 slow commands
SLOWLOG LEN              -- Count of slow entries
CONFIG SET slowlog-log-slower-than 10000  -- Threshold in microseconds
```

#### Memory Analysis

```
INFO memory              -- Overall memory stats
MEMORY USAGE key         -- Memory for a specific key
MEMORY DOCTOR            -- Diagnostic report
DEBUG OBJECT key         -- Encoding and size details
```

### Common Bottlenecks and Fixes

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| Big keys | Slow `DEL`, high memory | Break into smaller keys, use `UNLINK` for async delete |
| Hot keys | Single key hammered | Distribute across replicas, use local cache |
| O(N) commands on large collections | `KEYS *`, `SMEMBERS` on huge sets | Use `SCAN`, paginate with sorted sets |
| Thundering herd | Cache stampede on expiry | Use lock-based refresh or probabilistic early expiry |
| Missing TTL | Memory grows unboundedly | Set TTL on all cache keys |
| Serialization overhead | Slow JSON parse/stringify | Use MessagePack or Protocol Buffers for large payloads |
| Connection exhaustion | Timeouts, connection refused | Use connection pooling, increase `maxclients` |
| Lua script blocking | Long-running scripts block server | Keep scripts short, avoid loops over large datasets |

### Error Handling

- Handle connection failures gracefully — the application should degrade, not crash.
- Set timeouts on all Redis operations.
- Handle full-memory conditions (`OOM` errors) with appropriate eviction policies.
- Use `UNLINK` instead of `DEL` for large keys to avoid blocking.

### Review Checklist

- [ ] **TTLs set** — Every cache key has an appropriate TTL
- [ ] **Key naming** — Consistent, documented naming conventions
- [ ] **Error handling** — Connection failures, timeouts, and full-memory conditions handled gracefully
- [ ] **Serialization** — Consistent format (JSON, MessagePack), no raw string concatenation
- [ ] **Connection pooling** — Client uses pooling, not opening per-request connections
- [ ] **Memory bounds** — `maxmemory` and eviction policy configured
- [ ] **Atomic operations** — Use pipelines, transactions, or Lua scripts for multi-step operations
- [ ] **No `KEYS *`** — Use `SCAN` for iteration in production

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

- Adapt all examples to the detected Redis client library. Do not assume `ioredis` when the project uses `redis-py` or `StackExchange.Redis`.
- Always set TTLs on cache keys — never leave keys without expiry unless they are permanent reference data.
- Never use `KEYS *` in production — use `SCAN`.
- Keep Lua scripts short and simple — long scripts block the Redis server.
- Use `data-sql` when the task involves relational databases.
- Use `data-graphql` when the task involves GraphQL schema or resolvers.
- Use `data-mongodb` when the task involves MongoDB queries or aggregation.
- Use `impl-*` skills when the task requires full backend feature implementation beyond Redis.
