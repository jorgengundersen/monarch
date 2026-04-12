# Monarch MVP PRD

> First shippable Monarch loop.

**Status:** Draft
**Date:** 2026-04-12

---

## Goal

Ship the smallest useful Monarch that lets a human govern work in one province
through a persistent steward, with durable task state, visible execution, and a
clean human review handoff.

## User

A single operator managing one project who wants structured delegation to AI
agents without losing visibility, control, or state.

## Problem

Today the operator must manually manage task decomposition, agent sessions,
worktree isolation, and review handoff. This does not scale and makes it easy
to lose context or trust the wrong work.

## MVP Outcome

The user can:
- create a province with `rex`
- register or create a persistent steward for that province
- delegate a higher-order task to the steward
- have the steward either do the work directly or decompose it into a beads task graph
- have the steward run at most one ephemeral worker at a time in its own worktree and tmux session
- receive a review-ready result as a pushed branch, a local worktree to inspect, and a durable review-ready state in beads

## Success Criteria

The MVP is successful when all of the following are true:
- the user can always see which task the steward owns and whether a worker is active
- all delegated work is tracked in beads
- each worker runs in an isolated worktree and visible tmux session
- the handoff to human review is explicit, durable, and queryable
- no hidden state is required to understand what happened or what happens next

## In Scope

- `rex` creates the minimum province structure required to operate
- one persistent steward per province
- one active ephemeral worker maximum per steward
- beads is the only task source and source of truth for work state
- steward accepts higher-order tasks from the human
- steward has explicit instructions for when and how to decompose work
- steward may create a small task graph in beads for worker-executable tasks
- steward may also do clearly scoped, low-risk work directly
- worker result is committed and pushed to a matching remote branch
- worker handoff marks the work as ready for human review in beads

## Out of Scope

- pull request creation
- merge queue or auto-merge
- multi-province briefing or Hand workflows
- council roles
- parallel workers within a province
- protocol composition engine
- generalized daemon ecosystem beyond what is needed for this loop

## MVP Flow

1. The user runs `rex` to create a province.
2. `rex` creates the minimum province structure, including province config, beads integration, a shared repo/worktree layout, and steward context.
3. The user delegates a higher-order task to the province steward.
4. The steward inspects the task and chooses one path:
   - do the work directly if it is already well-scoped, low-risk, and fits steward scope
   - decompose it into a small beads task graph if worker execution is more appropriate
5. The steward selects one ready worker task.
6. The steward spawns one ephemeral worker in its own worktree and tmux session.
7. The worker executes the task, commits its changes, and pushes to a matching remote branch.
8. The steward marks the task as ready for human review in beads and points to the branch and worktree.
9. The human reviews and decides what happens next outside the MVP.

## Steward Responsibilities

- persist as the accountable agent for one province
- accept delegated tasks from the human
- maintain clear ownership of current steward work
- decide direct execution vs decomposition
- create worker-ready beads tasks with explicit acceptance criteria
- ensure no more than one worker is active at a time
- track worker status and surface review handoff clearly

## Steward Decomposition Rules

The steward should decompose when work is too broad, ambiguous, or large for a
single worker session.

The steward should produce worker tasks that are:
- scoped tightly enough for one worker session
- independent where possible, but executed sequentially in MVP
- written with explicit acceptance criteria
- linked in beads so the operator can understand the graph and provenance

The steward should work directly only when the task is already well-scoped,
low-risk, and does not justify spinning up a worker.

## Province Minimum Structure

`rex` must create only the minimum structure needed to make the loop work.
That structure should include:
- province config
- beads integration for province work tracking
- shared git storage/worktree layout
- steward runtime context
- a predictable location for worker worktrees

Exact file and directory names can be finalized in implementation specs.

## Review Handoff

The review handoff must include all of:
- a local worktree path to inspect
- a branch pushed to the remote
- a durable beads state indicating ready for review

Labels may be added for ergonomics, but review readiness should not rely on a
label alone.

## Command Surface Required for MVP

At minimum, `rex` must support commands to:
- create a province
- register or initialize a steward for a province
- delegate a task to a steward
- inspect province, steward, worker, and task status
- locate the active worker tmux session and worktree

## Risks

- steward decomposition quality may be inconsistent early on
- worktree and branch conventions may drift if not made explicit
- beads workflow may need small state model adjustments for review handoff
- tmux and harness integration may expose edge cases in lifecycle management

## Notable Follow-on Specs

- province structure spec
- steward role spec
- worker lifecycle spec
- `rex` command spec
- beads state model for delegation and review
