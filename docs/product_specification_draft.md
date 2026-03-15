# Monarch — Product Specification (Early Draft)

> *This document bridges the Monarch governance model to a concrete description
> of what the system does for its users. It is deliberately form-factor agnostic
> — how the system is delivered is a separate decision. This spec describes what
> Monarch enables, not how it is built.*

______________________________________________________________________

## Purpose

Monarch is a governance system for people who work with multiple AI agents
across multiple projects.

When the number of agents, projects, and tasks grows beyond what a person can
track in their head, work starts to fall through the cracks. Quality becomes
inconsistent. Context gets lost between sessions. The person either
micromanages — reviewing everything, trusting nothing — or lets go and hopes for
the best.

Monarch gives that person a third option: a structured system that distributes
their intent, enforces their standards, and keeps them informed — so they can
govern their work rather than chase it.

______________________________________________________________________

## Key Concepts

These are the building blocks of Monarch. Each one maps to a real function in
the system.

### Realm

The total scope of what Monarch governs. A realm is a person's complete
workspace — all of the projects, agents, and work that falls under their
authority.

A user has one realm. Everything Monarch manages lives inside it.

### Province

A self-contained project within the realm. Each province is isolated from the
others — it has its own context, its own work, and its own responsible agent.

Isolation is the point. A bug in one province does not become a distraction in
another. A deadline in one does not create pressure in the rest. Each province
can be governed according to its own needs.

### Endeavour

A defined unit of work within a province. Endeavours are how ambitious goals
become manageable. Each one is scoped clearly enough that its outcome can be
assessed: done or not done, good or not good.

Endeavours are what get assigned, tracked, reviewed, and completed. They are
the atomic unit of progress in Monarch.

### Steward

The agent responsible for a province. The steward is the single point of
accountability for everything happening within that project. The user interacts
with the province primarily through its steward.

A steward may coordinate other agents internally, but the user does not need to
manage that complexity. The steward handles it.

### The Hand

The user's chief of staff across the entire realm. The Hand provides awareness
of what is happening across all provinces, helps prioritise where the user's
attention should go, and relays the user's decisions back into the system.

The Hand is how the user stays informed without having to check each province
individually.

### Council

A set of specialised advisers available to the user and the Hand. The council
is not required from day one — it emerges as the realm grows and the user needs
dedicated support for specific concerns like quality assurance, security, or
cross-project coordination.

### Royal Protocol

A defined workflow that encodes how a type of work should be done. Protocols
specify the steps, the standards, and the review points for a given kind of
endeavour.

Protocols are the user's judgment made repeatable. Instead of explaining
expectations every time, the user defines them once and the system carries them
forward.

### Checkpoint

A moment within a protocol where the user reviews progress before work
continues. Checkpoints are how the user maintains control without
micromanaging.

High-risk work gets more checkpoints. Routine work gets fewer. The density
reflects the user's trust in the process and the consequences of getting it
wrong.

______________________________________________________________________

## Core Capabilities

### Setting Up Work

**Establish provinces.** The user can create isolated project workspaces and
assign a steward to each one. Each province gets its own context and boundaries.

**Define endeavors.** The user can decompose goals into scoped, assessable
units of work. Endeavors can be created directly or with the help of the Hand,
council members, or a steward, which can suggest decomposition based on the user's goals.

**Select or create protocols.** The user can choose from existing workflow
definitions or create new ones. Protocols define how work proceeds — the
phases, the expectations at each phase, serialization and parallelism, and where checkpoints fall.

**Calibrate oversight.** The user can set the checkpoint density for each
endeavour or protocol. More review for unfamiliar or high-stakes work. Less for
work that has proven reliable.

### Executing Work

**Delegate to stewards.** Once an endeavour is defined and a protocol is
selected, the steward carries it forward. The user does not need to supervise
each step — the protocol and checkpoints handle that.

**Pause at checkpoints.** When a checkpoint is reached, work stops and the user
is presented with the current state for review. The user can approve, redirect,
or reject before the next phase begins.

**Intervene at any time.** The user is never locked out. Regardless of
protocols or delegation, the user can reach into any province, inspect any
endeavour, and change course. The system supports structured governance but
never enforces it against the user's will.

### Overseeing Work

**Receive briefings.** The Hand provides a consolidated view of what is
happening across the realm — which provinces are active, what progress has been
made, where blockers exist, and what needs the user's attention.

**Review by exception.** The system surfaces what matters. Provinces running
smoothly do not demand the user's time. The user's attention is directed to
decisions, blockers, and completed milestones — not routine status.

**Track progress across endeavours.** The user can see the state of all active
endeavours — what phase they are in, whether they are on track, and what
remains.

**Escalate concerns.** When a steward encounters something outside its
authority or beyond its confidence, it escalates to the user (or to the Hand,
who brings it to the user). The user is never the last to know.

### Adapting Over Time

**Adjust checkpoint frequency.** As trust in a steward or protocol grows, the
user can reduce oversight. As risk increases or trust erodes, the user can add
checkpoints back. This is a continuous calibration, not a one-time setting.

**Evolve protocols.** Protocols are not fixed. The user can modify, extend, or
replace them as they learn what works. Good protocols get reused. Bad ones get
retired.

**Grow the council.** As the realm expands, the user can introduce specialised
advisers to handle concerns that the Hand alone cannot cover. The council is an
extension of the user's capacity, not a bureaucracy.

**Reorganise provinces.** Projects change. The user can restructure provinces,
reassign stewards, archive completed work, and spin up new initiatives as
needed.

______________________________________________________________________

## Interaction Model

Monarch is designed around a small number of interaction patterns that repeat
at different scales.

**Briefing.** The user checks in and gets an overview. This might happen at the
start of a session or on demand. The Hand tells the user what has happened,
what needs attention, and what is waiting for a decision.

**Decision.** The user makes a call. This could be approving a checkpoint,
resolving a blocker, setting priorities, or changing direction. Decisions flow
back into the system through the Hand or directly to a steward.

**Delegation.** The user defines what needs to happen and hands it off. This
could be a new endeavour, a new province, or an instruction to an existing
steward. Once delegated, the system carries it forward within the defined
structure.

**Inspection.** The user looks deeper into a specific province or endeavour.
This is the exception, not the norm — it happens when something is unusual, when
the user is curious, or when trust needs to be verified.

**Configuration.** The user adjusts the system itself — protocols, checkpoints,
council composition, province structure. This is governance work, not project
work. It shapes how future work will be handled.

These patterns can be as lightweight or as involved as the situation demands.
A quick briefing and a single approval might take moments. Setting up a new
province with custom protocols might take longer. The system accommodates both.

______________________________________________________________________

## Scaling

Monarch is designed to work across a range of complexity.

**One project, one agent.** At its simplest, Monarch is a structured way to
work with a single AI agent on a single project. The user defines endeavours,
picks a protocol, and reviews at checkpoints. There is no Hand, no council —
just a steward and a clear workflow. Even at this scale, the structure provides
value: consistent quality, clear expectations, and a record of progress.

**Several projects, several agents.** This is where the Hand becomes essential.
The user cannot track multiple projects in their head. The Hand provides the
overview, surfaces priorities, and ensures nothing is forgotten. Provinces keep
projects isolated. The user governs through briefings and decisions rather than
constant supervision.

**Many projects, diverse domains.** At full scale, the council emerges.
Specialised advisers handle cross-cutting concerns. Protocols become more
refined and domain-specific. The user's role shifts further toward governance —
setting direction, making high-level decisions, and calibrating the system
itself.

Monarch does not require the user to adopt all of its structures at once. The
system grows with the user's needs. Start with a province and a steward. Add
the Hand when oversight gets hard. Add the council when specialisation is
needed.

______________________________________________________________________

## What Monarch Is Not

**Monarch is not an AI agent.** It is a system for governing AI agents. The
agents do the work. Monarch provides the structure, the standards, and the
oversight.

**Monarch is not an automation pipeline.** Pipelines execute predefined steps.
Monarch governs adaptive work where judgment is required, where unexpected
situations arise, and where human authority must be preserved.

**Monarch is not a project management tool.** It does not replace issue
trackers, kanban boards, or sprint planners. It operates at a different level —
governing how AI agents execute work, not how humans organise their own tasks.

**Monarch is not opinionated about domains.** It works for software
development, data analysis, writing, research, design, or any other domain
where AI agents can be usefully employed. The protocols are what carry domain
knowledge, and those are defined by the user.

**Monarch is not a replacement for human judgment.** It is a multiplier for it.
Every structure in the system exists to carry the user's standards further — not
to make decisions on their behalf.

______________________________________________________________________

*This is an early draft. It describes intent and direction, not commitments.
Capabilities, interaction patterns, and scaling behaviour will be refined as
the concept develops.*
