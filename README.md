# Sealife

> A habit-tracker backend built for one reason: **learning backend development**.

This isn't a product. It's a playground that grows in layers, where each stage adds one new piece of infrastructure only after the previous one makes sense.

## Roadmap

| Stage | Topic                                      | Focus                                      |
| :---: | ------------------------------------------ | ------------------------------------------ |
|   1   | [NestJS](#stage-1--nestjs)                 | Framework fundamentals                     |
|   2   | [Database](#stage-2--database)             | Prisma + PostgreSQL                        |
|   3   | [Authentication](#stage-3--authentication) | JWT, guards, roles                         |
|   4   | [Redis](#stage-4--redis)                   | Caching, rate limiting, locks              |
|   5   | [Kafka](#stage-5--kafka)                   | Event-driven architecture                  |
|   6   | [Workers](#stage-6--workers)               | Background processing and failure handling |
|   7   | [Microservices](#stage-7--microservices)   | Splitting it all apart                     |

---

## Stage 1 — NestJS

Learn, in this order:

- [x] Modules
- [x] Controllers
- [x] Services
- [ ] Dependency Injection
- [ ] DTOs
- [ ] Validation

## Stage 2 — Database

```
NestJS → Prisma → PostgreSQL
```

**Build** these models:

- [ ] `User`
- [ ] `Habit`
- [ ] `HabitCompletion`

## Stage 3 — Authentication

- [ ] JWT
- [ ] Guards
- [ ] RBAC
- [ ] Password hashing

## Stage 4 — Redis

```
NestJS
├── PostgreSQL
└── Redis
```

**Learn:**

- [ ] Caching
- [ ] TTL
- [ ] Rate limiting
- [ ] Distributed locks

## Stage 5 — Kafka

```
Habit Service
      │
      ▼
    Kafka
      │
      ├── Statistics
      ├── Notifications
      └── Achievements
```

**Learn:**

- [ ] Producers
- [ ] Consumers
- [ ] Topics
- [ ] Partitions
- [ ] Consumer groups
- [ ] Offsets
- [ ] Event-driven architecture

## Stage 6 — Workers

```
Kafka
  │
  ├── Statistics Worker
  ├── Notification Worker
  └── Achievement Worker
```

**Learn:**

- [ ] Background jobs
- [ ] Retries
- [ ] Dead-letter queues
- [ ] Idempotency
- [ ] Failure handling

## Stage 7 — Microservices

> Only after everything above makes sense.

```
                 API Gateway
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      Auth          Habit         User
     Service       Service       Service
                      │             │
                      └──────┬──────┘
                             ▼
                           Kafka
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
            Stats      Notification    Achievement
           Worker         Worker         Worker
```

At that point you'll actually understand **why** each component exists.
