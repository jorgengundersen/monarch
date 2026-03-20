# Testing Standards

> TDD workflow, framework choices, and test boundaries for Monarch.

**Status:** Accepted
**Date:** 2026-03-20

---

## TDD Workflow

Red/green TDD. One test then one implementation at a time. This is mandatory for
all code-producing work.

1. Write one failing test (red)
2. Write the minimum implementation to pass it (green)
3. Refactor if needed (only if the code warrants it — don't force it)
4. Repeat

This is enforced by convention and agent instructions, not tooling.

## Framework

**stdlib `testing` + custom `internal/assert` package.**

No external test dependencies. The `internal/assert` package provides a small
set of assertion helpers to make TDD cycles less verbose:

```go
// Target API — small, focused
assert.Equal(t, want, got)
assert.NoError(t, err)
assert.Error(t, err)
assert.ErrorIs(t, err, target)
assert.Nil(t, val)
assert.NotNil(t, val)
assert.True(t, condition)
assert.False(t, condition)
assert.Contains(t, haystack, needle)
```

This package uses `reflect.DeepEqual` for comparisons. If deep equality edge
cases become painful (nil vs empty slice, unexported fields, etc.), we
re-evaluate and may pull in `testify/assert` — but only then, with a clear
reason.

All assertion functions call `t.Helper()` so failure messages point to the
test, not the helper.

## Test Philosophy

**Black-box by default.** Test the contract (inputs to outputs and side
effects), not the internals. Litmus test: can you refactor the implementation
without breaking the test? If no, the test is wrong.

**Exception:** Complex algorithms (parsers, state machines, constraint solvers)
where internal paths have many independent edge cases. Internal tests are
acceptable here. Document why.

## Test Boundaries

| Level | What | Speed | Where |
|---|---|---|---|
| Unit | Single function or method against its contract | Fast | `*_test.go` alongside the code |
| Integration | Multiple packages composing correctly | Medium | `*_test.go` with build tags if needed |
| System | Critical end-to-end paths | Slow | `cmd/` or dedicated `e2e/` directory |

**Focus investment on unit and integration tests.** System tests are few and
focused on critical user-facing paths only.

## Testing Against Dolt

Tests that need a database hit a real Dolt instance — no mocks. Use a test
helper that spins up a temporary Dolt database, runs the test, and tears it
down. This prevents mock/production divergence.

```go
func TestRecordStore(t *testing.T) {
    db := testutil.NewTestDB(t) // creates temp Dolt, registers cleanup
    store := recordstore.New(db)
    // test against real store
}
```

The `testutil` package (in `internal/`) manages test database lifecycle.

## Conventions

- Test files live next to the code they test: `store.go` / `store_test.go`
- Test functions named `Test<Function>_<scenario>`:
  `TestGet_NotFound`, `TestTransition_InvalidState`
- Table-driven tests for functions with many input/output combinations
- No test helpers that hide what's being tested — keep test bodies readable
- Tests must be independent — no shared state between test functions
- Use `t.Parallel()` where safe to catch concurrency issues early

## Pre-commit Hooks

Before any commit:
- `gofmt` / `goimports` check (formatting)
- `golangci-lint run` (linting)
- `go test ./...` (all tests pass)

A commit that breaks tests or lint must not land.
