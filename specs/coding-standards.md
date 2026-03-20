# Coding Standards

> Error handling, style, and conventions for all Go code in Monarch.

**Status:** Accepted
**Date:** 2026-03-20

---

## Error Handling

One consistent strategy across all packages. Decided upfront per the
architecture principles: "Write error handling guide before first agent touches
code."

### Strategy

Three layers, each serving a different purpose:

#### 1. Sentinel errors for known failure modes

Each core package exports sentinel errors for its expected failure conditions.
These are the package's error contract — consumers know exactly what can go
wrong.

```go
// package recordstore
var (
    ErrNotFound    = errors.New("record not found")
    ErrDuplicate   = errors.New("duplicate record")
    ErrStoreClosed = errors.New("store closed")
)

// package statemachine
var (
    ErrInvalidTransition = errors.New("invalid transition")
    ErrGuardFailed       = errors.New("guard condition failed")
)
```

#### 2. Wrap with context when propagating

Every function that calls another and can fail adds context using `%w`. This
preserves the original error for `errors.Is()` / `errors.As()` checks while
building a human-readable chain for debugging.

```go
func (s *Store) Transition(id string, to string) error {
    rec, err := s.Get(id)
    if err != nil {
        return fmt.Errorf("transition %s to %s: %w", id, to, err)
    }
    // ...
}
```

Format: `"<what was attempted>: %w"`. Read top-down to understand the call chain.

#### 3. Custom error types only for structured data

Use custom error types when callers need to extract structured information from
the error, not just check its identity. Primary candidates: validation errors,
guard condition failures.

```go
type GuardError struct {
    RecordID string
    From     string
    To       string
    Guard    string
    Reason   string
}

func (e *GuardError) Error() string {
    return fmt.Sprintf("guard %s failed for %s -> %s: %s",
        e.Guard, e.From, e.To, e.Reason)
}

func (e *GuardError) Unwrap() error {
    return ErrGuardFailed
}
```

Callers use `errors.As()` to extract structured data:

```go
var ge *GuardError
if errors.As(err, &ge) {
    // access ge.Guard, ge.Reason, etc.
}
```

### Rules

- **Handle or propagate, never both.** Don't log an error and also return it.
  Propagate up, handle (log/react) at the top.
- **Always wrap with context.** Bare `return err` loses the call chain.
  Exception: trivial one-liner functions where the caller already has context.
- **No panics for runtime conditions.** Panics are for programmer bugs
  (violated invariants that should be impossible). Never for user input, missing
  records, network failures, or any expected failure mode.
- **No stringly-typed error checks.** Use `errors.Is()` and `errors.As()`,
  never `strings.Contains(err.Error(), ...)`.

### Where errors are handled (not just propagated)

| Layer | Responsibility |
|---|---|
| CLI (`cmd/rex`) | Translate errors to user-facing messages and exit codes |
| Orchestrator | Decide: retry, reassign, escalate, or abort |
| Event handlers | Decide: swallow, log, propagate, or trigger compensating action |

Everything below these layers wraps and returns.

## Style

- Follow standard Go conventions: effective Go, Go code review comments
- `gofmt` and `goimports` are non-negotiable — enforced by tooling
- Name for what it does in the domain, not how it does it
- Keep functions focused — single responsibility
- No dead code. If it's unused, delete it.
- Comments explain *why*, not *what*. The code explains what.
