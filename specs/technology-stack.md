# Technology Stack

> Language, runtime, tooling, and dependency choices for Monarch.

**Status:** Accepted
**Date:** 2026-03-20

---

## Language: Go

Go is the implementation language for all Monarch code — core systems, CLI, and
Monarch-specific internals.

**Rationale:**
- Native Dolt SDK for direct database integration
- Strong CLI ecosystem (cobra, bubbletea)
- Single binary compilation — easy to deploy in any environment
- Good concurrency model for orchestrator and daemon behavior
- Clean module system aligns with "importable by anyone" design principle
- `gofmt` eliminates formatting debates — one less thing for agents to get wrong

## Configuration Format: TOML

All human-edited configuration files use TOML.

**Rationale:**
- Explicit typing (no YAML gotchas like `no` becoming `false`)
- Comments supported (unlike JSON)
- Designed specifically for configuration files
- Good Go libraries (`BurntSushi/toml`, `pelletier/go-toml`)

Machine-generated or internal data may use other formats where appropriate (e.g.,
JSON for API responses, JSONL for beads export).

## Formatting: gofmt / goimports

Non-negotiable. All Go code is formatted with `gofmt`. Import grouping and
cleanup handled by `goimports`. Enforced in pre-commit hooks and CI.

## Linting: golangci-lint

Starting linter set:

| Linter | Purpose |
|---|---|
| `govet` | Subtle bugs: printf args, struct tags, etc. |
| `errcheck` | Enforces "always handle errors" policy |
| `staticcheck` | Best general-purpose static analyzer for Go |
| `unused` | Dead code detection |
| `goimports` | Import formatting and grouping |
| `revive` | Configurable style linter |

Start with these. Add more linters only when a specific class of problem emerges
that warrants automated detection. Configured in `.golangci.yml` at repo root.

## Dependency Policy

From the general architecture principles:

> *"Own when wrapper >= implementation: if wrapped surface area is small,
> writing it yourself = cheaper."*

**Guiding heuristics:**
- **Depend** when correctness is hard-won: crypto, auth, database drivers,
  protocol implementations
- **Own** when the wrapper is roughly the same size as the implementation
- External dependencies enter through wrapper packages that translate to our
  internal contracts — domain code never imports external libraries directly
- Each dependency is an intentional decision, not a default

**Current dependencies (beyond stdlib):**
- Dolt (database) — via wrapper in core
- `golangci-lint` (dev tooling only)
- Additional dependencies added here as they are approved
