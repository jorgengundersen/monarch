# Monarch — Open Questions for Specification

> Work through these roughly in order. Each section's answers inform the next.
> Fill in answers inline, then we'll turn them into proper specs.

---

## 1. Form Factor

The product spec deliberately avoids this. It's the first decision to make because
it constrains everything else.

**Q1.1** What is Monarch's primary interface?
- [x] CLI tool (like `git` or `bd`)
- [x] Long-running daemon/service
- [ ] Library/SDK that other tools integrate
- [x] Convention-based (config files + agent instructions, no dedicated runtime)
- [ ] Something else?

<Answer>

    This is something we need to spend a lot of time to get right.
    This project will move extreamly fast, and we need stay as nible and flexible as possible,
    to be prepare for form factor changes in the future. But i believe that if create solid base,
    we can achieve that.

    We definitly need to be able to control this with a command line tool. And while i like to stay on
    the command line, there might be more benefitial to have at least some obervability via a
    gui or web interface.

    Most of state will be handled by beads (more on that later). Beads will allow us to give
    agents persistant memory in form of identity, past/current/future work, messages (potentially).
    This might be sufficient to sync state across multiple interfaces (cli, web, dashbaord, who knows),
    but we should have the option for a server/client model open for evaluation.
    We will have some daemon behavior, that will listen to specific events (file changes, issues, issue status, request, messages, who knows?),
    and will either redirect, inform/report, activate a specific agent or workflow, etc.

    beads is backed by Dolt database. Since a dolt server is already a requirement
    for using beads, then we might as well utilize dolt if we need to.

    A lot of logic will be determined by file/directory structure of the realm. more on that later

</Answer>

**Q1.2** Where does Monarch run?
- [ ] Local machine only
- [ ] Local with optional remote sync
- [x] Server/cloud-hosted
- [ ] Doesn't matter yet

<Answer>

    we need to have some degree of flexibility, but there are two likely scenarios:
        1.
            - docker based. each province has its own container with its own dependencies for the project
            - maybe a monarch or council container for toplevel processing
            - maybe dolt server in a seperate container
            - linked via a docker network? I'm not 100% sure how this can be done
        2.
            - remote dedicated server (but that would also most likely utilize containers)

        3.
            - small kubernetes like minikube, etc.?

    we shold have an option to run it bare bone on host for some edge cases and controlled environment,
    but that should be very intentional and something you need to set explicitly in the config.

    I want have the a host installed command line tool that is used to control the monarchy,
    but any agents should run in a container. This tool should be used for any interaction needed within the monarchy system.
    Example: instead of relying of using beads command, or docker commands directly,
            the cli tool should facility these processes.

    this is important for two reasons;
        1. its a way to make sure that the governing system is working correctly, like using the correct label, name space, that everything is flowing correctly
        2. if we find other tools that suits us better, we want to be able to be able to swap external dependencies without breaking the whole system.


    I want to utilize tmux. one container per province, but each agent is run in its own
    tmux session. i want the agent harness to be ran in tui mode, so that i can
    both observe and interact with any agent. we can also utilize tmux functionality
    like easy session switching, send-keys command, set environment variables pr tmux session etc.

</Answer>

**Q1.3** Is Monarch tied to a specific AI provider (e.g. Claude Code), or
provider-agnostic from the start?


<Answer>

    all agents will be ran via agent harnesses like claude code, opencode, codex, etc.
    we should be harness agnostic to the best of our ability.
    primary harnesses we should support:
    - claude code
    - opencode
    - codex

</Answer>

**Q1.4** Does the Monarch (human) interact with the system through a single
entry point (e.g. one CLI), or through multiple tools (e.g. a CLI for config,
the Hand as a Claude session, stewards as separate sessions)?

<Answer>

    both human, daemon event triggers and agents will all interact with
    the monarchy. probably via CLI tool.
    If we see benefitial, we might move functionality to API, webapp, MCP, GUI?

    the human will be able to move down the the layers as need, example; via tmux agent sessions.

    some agent are bound to a specific directory, while other agents can move around more freely,
    but still in their tmux session.

</Answer>
---

## 2. Data Model

The concepts need concrete shapes before anything can be built.

**Q2.1** Where does Monarch store its state?
- [ ] Filesystem (files/directories, like git)
- [ ] Database (SQLite, Dolt, etc.)
- [x] Hybrid (config on disk, runtime state in DB)
- [ ] Other?

<Answer>

    definitly a hybrid with filesystem and dolt database.

</Answer>

**Q2.2** What does a realm look like on disk/in storage? Is it a directory?
A config file? A database?

<Answer>

    The things i outline here is just a rough sketch, and will be changed if we see fit.

    The Realm is located at a toplevel directory, example `~/realm/`.


    `AGENTS.md` that has some toplevel instructions

    `.beads/` -> toplevel beads database and config (like routing to sub databases)

    `monarchy/` that contains the toplevel configs. this can be metadata need to create a province, like link to git forge repo etc.

    `council/` that contains council member configs

    `provinces/`: This contains the provinces. i like to structure my repositories based on git forge, user/org then repo name. Examples:

    `provinces/github.com/jorgengundersen/my_fun_project/`
    `provinces/github.com/<work org>/serious_project/`
    `provinces/local/some_local_project/ -> `local/` is for git repos that is not synced to a git forge

    this of i typically would organize my git repos. we will use the same, but each project directory will not be the
    repostiry directly. instead it will act as project area (the province) that will a few things: (just a draft and might be changed)

    `<province config file>` (dont know the format yet

    `.beads/` -> redirect to `steward/province/.beads`

    `.repo.git` -> a shared bare repo. this enable us to have agent working in parallel, without a full clones. we will also have some sort of merge queue system per province. this allows the merge queue agent to see what all the workers are doing locally, without relying of push/pull over network

    `steward/province/` -> this is an independent git clone (main branch)

    `<directory for merge queue system>/province/` -> git worktree from `.repo.git` on main branch (we need to find a good name for merge queue system that fit our theme)

    `<workers directory>/` -> ephemeral worker worktrees
    `<workers directory>/<auto-gen worker name>/` -> git worktree from `.repo.git` on a generated worker branch. when the work is done, the branch is pushed, and a merge request is created, this directory should be nuked


    we might have other needs, but this is a start.

</Answer>

**Q2.3** What does a province map to concretely? A git repo? A directory?
A worktree? A container?

<Answer>
    see answer above
</Answer>

**Q2.4** What is the lifecycle of an endeavour? Sketch the state machine:
e.g. `created → assigned → in_progress → checkpoint → review → done`

<Answer>
    not sure yet. but your example could definitly be something like that.
    we need to be able able to assemble these workflows. also have some templetes to choose from?
</Answer>

**Q2.5** Are endeavours flat or hierarchical? Can an endeavour contain
sub-endeavours, or is that what protocols handle?

<Answer>
    they are as large and complicated as needed to complete the job in a predictable way.
    an important aspect in context engineering is that complex work is broken down into
    smaller, well defined, tasks that an agent can reasonably accomplish within a session,
    well within context window limit, and well before any compaction event take place.
    we want to avoid to hit the compaction event for any worker agents.
</Answer>


**Q2.6** What metadata belongs on an endeavour? (priority, risk level,
estimated complexity, tags, dependencies, etc.)

<Answer>
    not sure yet.
</Answer>

---

## 3. Agent Integration

How Monarch actually talks to AI agents.

**Q3.1** What does "assigning a steward" mean in practice? Is it:
- [x] Launching a new Claude Code session with specific context
- [x] Writing an AGENTS.md / system prompt into a province directory
- [ ] Configuring an MCP server connection
- [ ] Calling an API
- [x] Something else?

<Answer>
    what the steward role with involve is not entirly clear yet, and it will
    depend how large the project/provice is.

    my initial instict tells me that steward should be able to, when asked,
    give an overview of what is happening in the province.

    it might need to escalete issues to council/the hand/monarch if needed.

    it should try to resolve issues, if the issue has a clear and well defined fix, with managable risk.

    these we probably need to explore and tune these roles to make sure they are working
    and contributing in a productive way.

    any role will be monitored and evaluated. if they create more work, hichups, mess than what they are
    contributing, then they should be removed.

    the hirarchy and roles will evolve over time
</Answer>

**Q3.2** How does a steward report status back to Monarch? Push (agent writes
to a known location) or pull (Monarch queries the agent)?

<Answer>

    it will be most likely be some sort of message bead. we will create a mail/message protocol,
    using the message bead type in beads.

    if it is a bug that need monarch's attention, it will create a bug issue beads that and delegate to monarch.

    we might find other, and more useful ways of communication, that that is my initial thoughts

</Answer>

**Q3.3** How do checkpoints actually pause execution? Does the agent poll for
approval? Does Monarch kill/resume the agent process? Is it cooperative
(agent checks a gate before proceeding)?

<Answer>

    i guess we need to experiment witht this, but moving beads around, adding label or metadata
    that trigger sertain action will be key i think. when an issue is marked for human review,
    some agents will probably be have their agent harness session killed, util more work is on their plate.
    other agents will be idle and wait for message, issue or nudge (we define what a nudge is later), before it starts working again.

</Answer>

**Q3.4** Can a steward be a non-AI agent (e.g. a script, a human, a webhook)?
Or are stewards always AI agents?

<Answer>

    many of these roles will be more than just the agent. the deterministic system, predefined commands, hooks, and guardrails around them
    is as much part of defining the role that the agent itself. Some are ephemeral, some are deamons that will start the agent when AI is needed in the process, etc.

    it might be that some roles is just mechanical/deterministic code that is running, without and agent.

</Answer>

**Q3.5** How does the Hand get cross-province awareness? Does it read all
province state directly, or do stewards push summaries?

<Answer>
    in general, any toplevel roles can go through the layers of the realm as needed,
    read messages, issues etc from all the provinces -- but it all depends on their role and scope

    while the hand migh be able to walk around the provinces, i was thinking that the hand
    primarily focused on toplevel. it might get mail from steward, read mails from steward to the monarch,
    see all issues and bugs that needs the monarch's attention.

    we might have other roles in the council that work more across the layers.
    we might have a "Master of Whisperers" that has birds that are watching agent work
    and report if they are not doing what they are supposed to do or has stoped working unexpectadly.

    We might also have a sheriff, that has constables patrolling. they will probably be
    reasonable for maintaining the integrety of the monarchy. is the monarchy working as intended?
    is there any rouge agents working outside their intended area or scope?

    on a province level, we might have an officer under the steward that does security checks
    on the code base.

    the possibilities are endless. lets start small, and then build as we need.
    it is important that we design our system in a way that make it easy to add these types of roles and functionality.
    have strong primitives like issue tracking, mail/message-protocol, deamon functionality, persistant and ephemeral behavior,
    etc. is key for evolving monarchy system
</Answer>
---

## 4. Interaction & Commands

Turning the five interaction patterns (briefing, decision, delegation,
inspection, configuration) into concrete operations.

**Q4.1** What does a briefing look like? Is it a command the user runs
(`monarch briefing`), or something the Hand proactively surfaces?

<Answer>
    dont know yet. i have answered some of this earlier.
</Answer>

**Q4.2** How does the user delegate a new endeavour? Walk through the ideal
flow from "I have a goal" to "a steward is working on it."

<Answer>

    There will probably be many ways of achieving a goal, but this might be one of them:

    The monarch has created a spec for new functionality for one of the projects. The new spec is added to that repo (commited and pushed)
    This is handed a task to convert the spec to actionable issues/tasks for the ephemeral worker agents to execute and implement.
    There might be a predefined workflow/royal protocol, that describe the process like research phase (it might delegate some of the research or fact finding to ephemeral workers),
    that then results in a issue graph with epics/molecules that also mark what work can be done parallel and what needs to be done sequentially.

    it might also be that this is too fragile, and that the monarch need to be more involved in the research and planning phase.
    Maybe the monarch has a special team of workers, that the monarch controls directly, that will do the research and planning,
    before delegating in it the steward/province for execution.

    this will depend on the type of work, complexity etc.

    at least, in the beginning, the monarch will be heavily involved and hands-on to make sure things are running as intended,
    and fix/tune any processes.

    we are doing pioneer work with this type of agentic workflow management system. we need to be flexible, and adapt when needing too.

</Answer>

**Q4.3** How are checkpoint reviews presented? Diff? Summary? Interactive
approval prompt?

<Answer>

    not sure. i imagine that in the beginning it will just be a task/issue for the monarch,
    specifying what project/branch (with some context about what the agent has been working on),
    and the monarch will simply check the diff directly.

    We will have pre-commit hooks, making sure that any commited work has passed some automatic checks and tests.
    A general mandate for any agents producing code is to work red/green TDD, one test and one implementation at a time.
    This, togheter with pre-commit hooks, give us some quality guardrails.

    Any task/issue created must have a clear acceptance criteria.
</Answer>

**Q4.4** What does "intervene at any time" look like in practice? Does the
user SSH into a province? Open a chat with the steward? Edit files directly?

<Answer>

    We will spawn any agent inside a dedicated tmux session in tui mode.
    This means that i can go to and directly communicate/intervene with any agent running

    Some of these agents will be singleton and have persistant longterm memory via beads (issues, mails, maybe notes?, etc.),
    and some are ephemeral.

    If the agents are running in a loop (like a ralph loop), we might need to use a hook in the agent harness to make sure that the tui exits when finished, so that the loop can continue as normal (but that is technical details for a later discussion).

</Answer>

**Q4.5** How does the user configure protocols and checkpoint density? Config
files? CLI commands? Conversationally through the Hand?

<Answer>

    We want the system to be as deterministic as possible, to achieve the desired stability and predictability.
    we will achieve this with structured workflows and processes and procedures, that is configured and enforced
    via config files, beads database, maybe monarch specific dolt database, commands via command line tools,
    deamons for looping behavior or triggering next phase in workflows etc, and potentially a server running in the background (only if needed).

    how this will be done technically, is a discussion at a later time.

</Answer>

---

## 5. Protocols

The most novel concept — "the user's judgment made repeatable."

**Q5.1** What format are protocols defined in?
- [x] YAML/TOML config files
- [ ] Code (functions/classes)
- [ ] A custom DSL
- [x] Natural language with structured annotations
- [ ] Other?

<Answer>
    config files will either be json/toml/yaml, whatever suits us best.
    some behaviors and settings might be loaded into the beads, like persistant agent identities beads.
    some will be determined via AGENTS.md or harness config (like hooks, etc).

    start simple and expand when needed.
</Answer>

**Q5.2** What are the minimum required parts of a protocol definition?
(e.g. name, phases, checkpoint locations, acceptance criteria per phase)

<Answer>
    not sure yet. maybe you can make a suggestion based on what i have written in this document?
</Answer>

**Q5.3** Are protocols province-specific or shared across the realm?

<Answer>
    not sure yet. maybe you can make a suggestion based on what i have written in this document?
</Answer>

**Q5.4** Can protocols compose? (e.g. a "deploy" protocol that includes a
"test" protocol as a sub-phase)

<Answer>
    probably. i want this to be as fexible as possible, so we can adopt to a wide range how usecases for this system.
</Answer>

**Q5.5** Do you have a concrete example of a protocol you'd want to define?
Walk through it step by step — this will ground the format decisions.

<Answer>
    maybe you can make a suggestion based on what i have written in this document?
</Answer>

---

## 6. Scope & Priorities

What to build first.

**Q6.1** What's the smallest useful version of Monarch? What can you cut and
still have something worth using?

<Answer>
    The smallest, useful version of monarch is that we can create a province,
    create a steward agent for that province, have the basic issue/task tracking setup with beads,
    be able to delegate work to ephemeral workers, and that i can access any agent via tmux sessions.
    Another important requirement is that any processes runs in docker container (one per province, one for dolt server and one for any toplevel processing)

    we should be able to setup simple workflows. the monarch (the human) will review before merging.

    we need at least some of the lowlevel plumbing in place.

    also give suggestion on what you mean that a MVP should look like?
</Answer>

**Q6.2** Which role is most important to get right first: the Hand, stewards,
or protocols?

<Answer>
    stewards and some basic protocols. i want protocols and or workflows to be flexible as possible, by assembling them from primitive building blocks.

    also. we should probably have a discussion on what is a protocol and what is a workflow, and if they are the same or differnet.

    also have a glossery document in `docs/`
</Answer>

**Q6.3** Are you building this for yourself first, or for others from the
start?

<Answer>
    this will be for me... but i do want to make sure that we can make it so that other can use this setup
    at a later stage. so we don't want to hard code dependencies tided to my specific environment or setup.

    make this as configurable as possible. also make sure that configuration is set at the the edges of the program.
    any lower level code should not know or concern itself with where, what and how configurations are set.
</Answer>

**Q6.4** What's your current pain point that Monarch would solve *today* if
it existed?

<Answer>
    it will solve a few things/pain points:

    1. be able to create structured workflows, where higher level requirements or requests are broken down into managable tasks that ephemeral agents can work (in parallel if possible) without tripping over each other in the same worktree.
    2. track work with beads
    3. i learn what works and what not works, i can codify these lessons, so that the system can get more and more autonomus over time.

</Answer>
---

*Once you've answered these, we can turn each section into a proper spec
document in this directory.*
