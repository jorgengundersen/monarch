# Core System Architecture

> High-level overview of the foundational systems that power Monarch and can
> be used independently by others.

**Status:** Draft
**Date:** 2026-03-19

---

## Context

Monarch is an opinionated multi-agent workflow system. But underneath the
Monarch-specific concepts (provinces, stewards, protocols, etc.) lies a set of
general-purpose core systems that have no knowledge of Monarch's domain.

This document captures what those core systems are, what they do, and how they
relate to each other.

---

## Design Principles

1. **Core knows nothing about Monarch** — The core packages are
   general-purpose libraries. No "steward", "province", or "protocol" in the
   core. Monarch maps its domain language onto core primitives.

2. **Importable by anyone** — The core systems are designed as standalone
   packages/modules that others can import and use to build their own
   multi-agent workflows, CI/CD orchestrators, or whatever they need.

3. **Monarch is a consumer** — Monarch-specific things (the `rex` CLI,
   monarchy configuration, protocols, roles) are internal packages that
   consume the core libraries. Monarch is one opinionated application built on
   top of the core — not the only possible one.

4. **Persistent and crash-safe** — All state survives agent crashes, context
   window evictions, process restarts, and machine reboots. This is
   non-negotiable.

5. **Minimal primitives, maximum composability** — Small, focused components
   with clear contracts that compose into larger behaviors.

6. **Open enums, not closed ones** — All types, states, and categories
   (record types, record states, relationship kinds, agent role types, etc.)
   are extensible by the consumer. The core provides sensible defaults but
   never prevents addition of new values. We don't know what we'll need in
   the future, and the system must accommodate that without breaking changes.

---

## Core Systems

There are five core systems. Each is an independent package with a clean API
surface.

### 1. Record Store

The persistent, queryable storage layer for all tracked information in the
system.

#### The Record Primitive

A **record** is a typed, stateful unit of information with relationships to
other records. It is the single universal primitive for everything the system
tracks: tasks, bug reports, messages, feature requests, discussions, incidents,
maintenance events, and anything else a consumer defines.

The key insight: the difference between a "task" and a "bug report" and a
"message" is not a different data model — it's a different **type** with
different metadata and a different state machine. The storage, relationships,
querying, and event emission work identically for all of them.

```
Record {
  id:             ID              // unique, system-assigned
  type:           string          // "task", "bug", "message", "incident", ...
  state:          string          // governed by type's state machine
  title:          string          // human-readable summary
  body:           string          // detailed description / content
  metadata:       Map<string,any> // type-specific fields (see below)
  relationships:  Relationship[]  // connections to other records
  created_by:     ActorRef        // agent ID or human ID
  assigned_to:    ActorRef?       // who is responsible (optional)
  origin:         string?         // where the record was created (path, workspace,
                                  // project context). Helps scope records and
                                  // understand context without explicit project fields.
  created_at:     Timestamp
  updated_at:     Timestamp
}

Relationship {
  target:         ID              // the related record's ID
  kind:           string          // "parent", "child", "blocks", "caused-by",
                                  // "responds-to", "related-to", "discovered-during", ...
}
```

#### What counts as a record (and what does not)

This is critical. The record primitive is powerful because it's general, but
it must not become a dumping ground for everything.

**A record is appropriate when:**
- It needs to be **tracked** through a lifecycle (has meaningful state changes)
- It needs **relationships** to other things in the system (traceability)
- It needs to **persist** beyond the current session or process
- Someone (human or agent) may need to **query** for it later
- It represents a **unit of information that the system should act on**

**A record is NOT appropriate for:**
- Ephemeral runtime data (CPU usage, memory stats, temp variables)
- Raw logs or streams (use a logging system)
- Large binary artifacts (store a reference/pointer, not the artifact itself)
- Configuration (use config files or the agent store)
- Transient internal computation (intermediate agent reasoning)

**The litmus test:** If you can't name who would query for this record and why,
it probably shouldn't be a record.

#### Built-in record types (defaults, all extensible)

The core ships with these types. Consumers can add more, modify metadata
schemas, or ignore the ones they don't need.

| Type | Purpose | Example metadata |
|---|---|---|
| `task` | A unit of actionable work | acceptance_criteria, priority |
| `bug` | A discovered defect | severity, reproduction_steps, discovered_during |
| `message` | Communication between actors | sender, recipient, message_kind (clarification/escalation/coordination/status/review), blocking |
| `feature` | A requested capability | requester, rationale |
| `incident` | A safety or operational event | severity, impact, mitigation |
| `discussion` | A threaded conversation | topic, participants |
| `decision` | A recorded decision | alternatives_considered, rationale, decided_by |
| `maintenance` | A maintenance operation | target, schedule |

#### Relationship kinds (defaults, all extensible)

| Kind | Meaning | Example |
|---|---|---|
| `parent` / `child` | Hierarchy / decomposition | Feature decomposes into tasks |
| `blocks` / `blocked-by` | Ordering dependency | Task B can't start until task A completes |
| `caused-by` | Causal link | Bug was caused by a specific change |
| `discovered-during` | Provenance | Bug found while working on task X |
| `responds-to` | Reply chain | Message Y is a response to message X |
| `related-to` | Loose association | Incident is related to a feature |
| `produces` / `produced-by` | Output link | Discussion produced a decision |

**Responsibilities:**
- CRUD operations on records of any type
- Record hierarchy and relationships (typed edges in a graph)
- Querying by type, state, relationships, metadata, assignee, etc.
- Atomic operations (claim a record, complete a record, create children)

**Key properties:**
- Durable — survives crashes and reboots
- Queryable — efficient lookup by any combination of fields
- Concurrent-safe — multiple agents can operate without races
- Type-aware — validates metadata against type schemas
- Graph-native — relationships are first-class, not bolted on

**Does NOT handle:**
- Deciding what to do next (that's the orchestrator)
- Reacting to state changes (that's the event system)
- Validating state transitions (that's the state machine)
- Business logic around record types (that's the consumer)

### 2. State Machine

The per-type lifecycle engine that governs valid state transitions.

Each record type has its own state machine definition. The state machine
validates transitions, enforces guard conditions, and emits events.

**Responsibilities:**
- Define valid states and transitions per record type
- Enforce transition rules (can't skip states, can't go backwards unless
  explicitly allowed)
- Guard conditions on transitions (e.g., "all children must be complete")
- Emit transition events (consumed by the event system)

**Key properties:**
- Deterministic — same state + same input = same result
- Extensible — consumers can define custom states, transitions, and guards
- Per-type — each record type has its own state machine configuration
- Validated — invalid transitions are rejected, not silently ignored

**Example state machines (defaults, all configurable):**

Task:
```
reported → triaged → ready → assigned → in_progress → complete → done
                                              │
                                              ↓
                                       review_requested → approved → done
```

Message:
```
draft → sent → delivered → read → responded
                                      ↓
                                    closed
```

Bug:
```
reported → confirmed → ready → assigned → fixing → fixed → verified → closed
                 │                                             │
                 ↓                                             ↓
             not_a_bug                                    reopen → assigned
```

Consumers can define entirely new state machines for their own record types,
or override the defaults.

**State descriptions (for task type):**
- `reported` — raw discovery, unverified, unscoped
- `triaged` — verified as real, needs scoping and acceptance criteria
- `ready` — fully scoped, acceptance criteria defined, available for assignment
- `assigned` — claimed by an agent
- `in_progress` — actively being worked on
- `complete` — work finished, pending verification
- `done` — verified and closed

**Does NOT handle:**
- Storing records (that's the record store)
- What happens when a transition occurs (that's the event system)

### 3. Event System

The reactive layer that connects state changes to behavior.

**Responsibilities:**
- Emit events when record state transitions occur
- Emit events on record creation, update, and relationship changes
- Allow consumers to subscribe handlers to specific events
- Support event filtering (by record type, state, relationship, metadata)
- Ordered, reliable delivery within a process

**Event examples:**
- `record.created` — a new record was added (with type info)
- `record.state.changed` — a record transitioned state
- `record.relationship.added` — a new relationship was created
- `record.children.all_complete` — all children of a record are done
- `record.dependency.resolved` — a blocking dependency was cleared
- `agent.state.changed` — an agent instance changed state (e.g., crashed)
- `agent.spawned` — a new agent instance was created

Consumers can define custom events beyond these defaults.

**Key properties:**
- Decoupled — emitters don't know about subscribers
- Configurable — consumers wire up their own handlers
- Filterable — subscribe to events for specific record types, states, etc.
- This is where customization lives — hooks, checkpoints, protocols are all
  event handler configurations

**Does NOT handle:**
- Deciding what transitions are valid (that's the state machine)
- Long-running process management (that's the orchestrator)

### 4. Agent Store

The persistent registry of agent roles and agent instances.

The agent store is intentionally **separate** from the record store. Agents
are the **actors** that operate on records — they are not records themselves.
Agent IDs are referenced from records (as creators, assignees, senders) but
agents live in their own store.

> **Why separate?** Records are the *artifacts* of work — tasks, messages,
> bugs, decisions. Agents are the *actors* doing the work. Mixing them would
> blur the distinction between "who" and "what", make queries confusing
> (filtering agents out of record queries), and create circular dependencies
> (records reference agents, agents would reference themselves). Actors and
> artifacts are different things and belong in different stores.

The agent store has two distinct concepts:

#### Agent Roles (templates)

A role is a **definition** — it describes *what kind of agent* this is.

**Fields:**
- Role identifier (e.g., `worker`, `planner`, `reviewer`)
- Role description — instructions that define the agent's purpose, behavior,
  and constraints. This is the agent's "personality" and scope.
- Lifecycle type — `persistent` (long-lived, survives across sessions) or
  `ephemeral` (spun up for a task, torn down after)
- Capabilities and constraints — what this role is allowed to do and not do

A role is like a class. You define it once, and many agents can be instances
of it.

#### Agent Instances (running agents)

An instance is a **concrete agent** — a running (or recently running)
realization of a role.

**Fields:**
- Generated ID (unique, system-assigned)
- Role (which role this instance is based on)
- Name / nickname — human-friendly label for mental model and communication
  (e.g., "alice", "bob", "worker-3"). Makes it easy to say "what is alice
  working on?" instead of "what is agent a7f3b2 working on?"
- State (idle, running, crashed, suspended)
- Spawn location — where this agent is running (which machine, directory,
  worktree, container, tmux session)
- Current record (linked to record store — what they're working on)
- Metadata — extensible key-value pairs for consumer-specific needs

**Key properties:**
- Persistent — an agent instance record survives crashes and reboots, enabling
  state recovery. If "alice" crashes, we know what she was working on, where
  she was spawned, and what role she had — enough to reconnect or respawn.
- No scattered files — roles and instances are records in a store, not
  markdown files on disk
- Queryable — "which agents are idle?", "who worked on this task?", "which
  agents have the worker role?", "where is alice?"
- Decoupled from harness — the store tracks identity and state, not the
  runtime details of Claude Code vs. Codex vs. a shell script

**Does NOT handle:**
- Spawning or managing agent processes (that's the orchestrator)
- Deciding which agent gets which task (that's the orchestrator's scheduling)
- Communication content (messages are records in the record store that
  reference agent IDs)

### 5. Orchestrator

The active loop that watches state and drives work forward.

**Responsibilities:**
- Poll or react to ready records (typically tasks)
- Decide what to run next (scheduling / prioritization)
- Spawn and manage agent processes (creates agent instances in agent store)
- Monitor running agents (detect stuck/failed work)
- Handle agent completion (trigger state transitions)

**Key properties:**
- Pluggable scheduling — consumers define prioritization strategy
- Agent-agnostic — doesn't care if the agent is Claude Code, Codex, a shell
  script, or a human
- Scoped — can run against the full record store or a filtered subset
  (e.g., only records in a specific project)

**Does NOT handle:**
- Storing state (that's the record store)
- Validating transitions (that's the state machine)
- Defining what happens on events (that's the event system)
- Agent identity (that's the agent store)

---

## How They Compose

```
┌──────────────────────────────────────────────────────────────┐
│                       Consumer                               │
│                (Monarch, or your app)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────────────────┐              │
│  │  Orchestrator │  │ Event Handlers           │              │
│  │               │  │ (hooks, protocols, etc.) │              │
│  └──┬────────────┘  └──────────┬───────────────┘              │
│     │                          │                             │
│     │       subscribes to      │                             │
│     │            ┌─────────────┘                             │
│     ▼            ▼                                           │
│  ┌──────────────────┐                                        │
│  │   Event System    │◄──── emits events on all changes      │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │  State Machine    │◄──── validates transitions per type   │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐      ┌──────────────────┐              │
│  │  Record Store     │      │   Agent Store     │             │
│  │                   │◄────►│                   │             │
│  │ (tasks, messages, │ refs │ (roles,instances) │             │
│  │  bugs, decisions) │      │                   │             │
│  └──────────────────┘      └──────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

**Data flows down, events flow up.**

1. Orchestrator decides to act → calls state machine to transition a record
2. State machine validates → writes to record store
3. Record store persists → state machine emits event
4. Event system delivers → handlers react (possibly triggering more transitions)
5. Orchestrator observes new state → cycle continues

**Communication is just records:**

6. Agent encounters obstacle → creates a `message` record with relationship
   `regarding` → task X, with metadata `{kind: "escalation", sender: agent_id}`
7. Record store persists → event system emits `record.created` (type=message)
8. Event handler reacts (notify human, pause agent, reroute task, etc.)

**Full traceability example:**

```
feature-request "User SSO"           (type: feature)
  ├── child → task "Design SSO flow"  (type: task)
  ├── child → task "Implement SAML"   (type: task)
  │     ├── discovered-during → bug "Token expiry off-by-one" (type: bug)
  │     │     ├── caused-by → related code change              (type: task)
  │     │     └── produces → task "Fix token expiry"           (type: task)
  │     └── regarding → message "Need clarification on..."     (type: message)
  │           └── responds-to → message "Use SAML 2.0 not 1.1" (type: message)
  │                 └── produces → decision "SAML 2.0 chosen"  (type: decision)
  └── child → task "Write SSO tests"  (type: task)
```

One graph. Full trace from feature request to decision to bug to fix.

---

## What Monarch Adds On Top

Monarch is one opinionated consumer of these core systems. It adds:

| Monarch Concept | Maps To |
|---|---|
| Province | A scoped partition of the record store + agent store + a scoped orchestrator |
| Steward | An agent role + instance + an orchestrator scoped to a project |
| Hand | An agent role + instance + a meta-orchestrator across provinces |
| Council | Agent roles with advisory scope + event handlers for review gates |
| Protocol | A set of event handlers attached to a record type |
| Checkpoint | An event handler that creates a `message` (type review) and pauses |
| Endeavour | A record subtree (typically rooted at a feature or task) |
| Royal Decree | A `message` record with broadcast addressing |
| `rex` CLI | A CLI that wires everything together with Monarch's opinions |

None of these concepts exist in the core. They are all built by composing core
primitives with Monarch-specific configuration.

---

## Storage Abstraction

Each core store (Record Store, Agent Store) separates business logic from
persistence through a repository interface.

### Pattern

```go
// Each store defines its own repository interface tailored to its needs.
// The record store needs graph queries (relationships), the agent store doesn't.

// package recordstore
type Repository interface {
    Get(ctx context.Context, id string) (*Record, error)
    Put(ctx context.Context, record *Record) error
    Delete(ctx context.Context, id string) error
    Query(ctx context.Context, filter Filter) ([]*Record, error)
}

type Store struct {
    repo Repository
}
```

**Key decisions:**
- **Per-store interfaces** — each store defines its own repository contract.
  Forcing both through a generic engine either over-abstracts or under-serves
  one of them.
- **In-memory implementations** ship alongside each core package for testing
  and for consumers who don't need durability.
- **Dolt implementations** live in `internal/dolt/` — not importable by external
  consumers, isolated behind the core interfaces.
- **Blast radius** — changing persistence for one store doesn't touch the other.
  Swapping Dolt for something else means rewriting one wrapper, not the store
  logic.

This follows the dependency management principle: external dependencies enter
through wrappers. Domain code never imports Dolt directly.

---

## Observability

Operational observability is separate from the domain event system. Domain events
(`record.created`, `record.state.changed`) drive application behavior.
Observability lets humans and agents verify the system is behaving correctly at
runtime.

### Structured Logging

All logging uses Go's `log/slog` (stdlib). Structured events with typed fields,
not ad-hoc strings.

Core packages accept a `*slog.Logger` via their constructor. The consumer
configures output format and destination. Tests pass a no-op logger.

```go
store := recordstore.New(repo, recordstore.WithLogger(logger))
```

### Correlation

A correlation ID threads through operations via `context.Context`. All core
package methods accept `context.Context` as their first parameter. The
orchestrator or CLI sets the correlation ID at the entry point. Logged on every
observation.

### Observation Points

Observe at edges — where inputs arrive, external systems are called, state
changes, and errors are handled.

| Observation point | What to log |
|---|---|
| Record store mutations | Record ID, type, operation, actor, correlation ID |
| State transitions | Record ID, from, to, actor, guard results, correlation ID |
| Event emission | Event type, record ID, subscriber count, correlation ID |
| Event handler execution | Handler name, event type, duration, success/failure |
| Orchestrator decisions | What was scheduled, why, which agent |
| Dolt operations | Query, duration, rows affected |

Pure functions are silent — they are deterministic from their inputs and need no
observation.

---

## Contract Evolution

The system will evolve rapidly. The approach to change is: make additive changes
free, defer migration machinery until pain appears.

### Design for Additive Change

- **Open enums** (already a design principle) — new record types, states,
  relationship kinds, and metadata fields are additive and non-breaking.
- **Functional options** on constructors — APIs grow without breaking existing
  callers.
- **Zero-value safe** — new fields on structs default to their zero value.
  Existing records gain new fields with zero values, no migration needed.

### Core Package APIs Are Contracts

Don't break them without a reason. Follow Go conventions:
- Additive changes (new functions, new option fields) are non-breaking
- Deprecate before removing (`// Deprecated:` comments, flagged by staticcheck)
- Breaking changes require a new major version (`/v2` import paths)

### When Breaking Changes Happen

Handle them when they arrive, not before:
- **Record schema changes** — when the first breaking schema change occurs,
  add type versioning and migration functions then.
- **State machine changes** — when a live state machine needs modification,
  add state machine versioning then.
- **Migration infrastructure** — build it the first time data needs transforming,
  not preemptively.

The test suite is the safety net. Clean interfaces, good coverage, and
contained blast radius make rapid iteration possible.

### Architectural Invariants

These are enforced by structure today and by automated checks when the codebase
grows:
- No circular dependencies between packages
- Core packages never import from `internal/`
- No Monarch domain concepts (province, steward, protocol) in core packages
- Dependency direction: `cmd/ → internal/monarch/ → core → stdlib/wrappers`

---

## Next Steps

1. Design the interfaces/API surface for each core package
2. Define the record data model in detail (field validation, type schemas)
3. Define the agent data model (identity, capabilities, state)
4. Define the state machine configuration format
5. Define the event types and handler contract
6. Define the orchestrator plugin interface (scheduling, agent spawning)
7. Build the record store + state machine first (everything depends on these)
8. Build the agent store (enables multi-agent coordination)
9. Build the event system + orchestrator (brings it all to life)
