# Development Workflow

> Pre-commit hooks, quality gates, and the feedback loops that keep agentic
> development on track.

**Status:** Accepted
**Date:** 2026-03-20

---

## First Line of Defense

Specs define what right looks like. Pre-commit hooks enforce it mechanically.
Agents can't skip what the tooling blocks.

This is the core feedback loop for agentic coding:

```
specs + well-defined tasks/issues
         ↓
    agent writes code (red/green TDD)
         ↓
    pre-commit hooks block bad code
         ↓
    agent self-corrects
         ↓
    human reviews already-correct output
```

Every manual correction that could have been an automated check is a missed
opportunity. When a pattern of mistakes emerges, encode it as a hook or lint
rule — not a review comment.

## Pre-commit Hooks

Run on every commit, blocking if any check fails.

| Check | Tool | What it catches |
|---|---|---|
| Formatting | `gofmt` / `goimports` | Style inconsistencies |
| Linting | `golangci-lint run` | Bugs, unused code, error handling violations |
| Tests | `go test ./...` | Broken contracts, regressions |
| Build | `go build ./...` | Compilation errors, type mismatches |

A commit that fails any of these does not land. The agent fixes the issue and
creates a new commit — never `--no-verify`.

## CI Quality Gates

CI runs the same checks as pre-commit, plus anything too slow for a commit hook:

- All pre-commit checks (formatting, lint, test, build)
- Race detector: `go test -race ./...`
- Integration tests (if tagged separately)

CI is the backstop. Pre-commit catches most issues locally. CI catches what
slips through (different OS, race conditions, integration failures).

## Issue/Task Discipline

All work is tracked in beads (`bd`). Every task must have:
- A clear description of what needs to happen
- Acceptance criteria that an agent (or human) can verify

This is context engineering — the task description is the prompt. Vague tasks
produce vague output. Well-defined tasks with clear acceptance criteria let
agents self-verify against the criteria before marking work complete.

## Workflow

1. `bd ready` — find available work
2. `bd update <id> --claim` — claim it atomically
3. Read the task, understand acceptance criteria
4. Red/green TDD — one test, one implementation at a time
5. Pre-commit hooks validate on every commit
6. `bd close <id>` — when acceptance criteria are met
7. Discovered new work? `bd create ... --deps discovered-from:<id>`

## When Things Go Wrong

When a pattern of mistakes emerges:
1. Fix the immediate issue
2. Ask: what context was missing?
3. Update specs, add a lint rule, tighten a type, add a test
4. The next agent session starts with the fix baked in

Feedback that only lives in conversation or PR comments is lost. Convert it
into permanent codebase signals.
