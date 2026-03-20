# Project Structure

> Package layout, module organization, and import conventions.

**Status:** Accepted
**Date:** 2026-03-20

---

## Layout

```
monarch/
  recordstore/          # Core: persistent, queryable record storage
  statemachine/         # Core: per-type lifecycle engine
  eventsystem/          # Core: reactive event layer
  agentstore/           # Core: agent role and instance registry
  orchestrator/         # Core: scheduling and agent management loop
  cmd/
    rex/                # CLI entry point
  internal/
    monarch/            # Monarch-specific domain (provinces, stewards, protocols, etc.)
    assert/             # Test assertion helpers
    testutil/           # Shared test utilities (e.g., Dolt test DB setup)
  specs/                # Specification documents
  docs/                 # User-facing documentation
  tmp/                  # Working documents, drafts (not shipped)
```

## Principles

### Core packages are top-level

The five core systems live at the repository root as top-level packages. This
makes them directly importable by anyone:

```go
import "github.com/jorgengundersen/monarch/recordstore"
import "github.com/jorgengundersen/monarch/statemachine"
```

This follows idiomatic Go — everything not in `internal/` is public API. No
`pkg/` directory needed.

### Core knows nothing about Monarch

Core packages must never import from `internal/monarch/`. They have no knowledge
of provinces, stewards, protocols, or any Monarch domain concept. Monarch is one
consumer of the core, not a privileged one.

This is enforced structurally: core is top-level, Monarch is in `internal/`.
The Go compiler prevents `internal/` from being imported by external consumers,
and by convention core packages don't import from `internal/` at all.

### internal/ is not importable

Go enforces this at the compiler level. Code in `internal/` can only be imported
by code rooted at the parent of `internal/`. External consumers cannot import
Monarch-specific code, test helpers, or internal utilities.

Contents of `internal/`:
- `monarch/` — Monarch-specific domain logic, the `rex` CLI wiring, protocols,
  roles. This is where Monarch maps its domain language onto core primitives.
- `assert/` — Test assertion helpers used across all packages
- `testutil/` — Shared test infrastructure (e.g., temporary Dolt databases)

### One package, one responsibility

Each package has a clear, single responsibility matching the core system
architecture spec. No god packages. If a package is doing two things, split it.

### Dependencies flow one direction

```
cmd/rex → internal/monarch → core packages
                              core packages → (stdlib, Dolt wrapper)
```

Core packages may depend on each other where the architecture spec defines it
(e.g., orchestrator depends on record store, state machine, event system, agent
store). No circular dependencies.

## File Conventions

- One primary type or concept per file
- Test files alongside source: `store.go` / `store_test.go`
- Package-level documentation in `doc.go` if the package needs explanation
  beyond what the code shows
- Sentinel errors in `errors.go` within each package
- No `utils.go` or `helpers.go` — name files for what they contain
