import type {
  StateMachineDefinition,
  TransitionContext,
  TransitionResult,
  TransitionDefinition,
} from "./types.js";

export class StateMachine {
  readonly type: string;
  readonly initial: string;

  private readonly stateNames: Set<string>;
  private readonly transitionDefs: TransitionDefinition[];

  constructor(definition: StateMachineDefinition) {
    this.type = definition.type;
    this.initial = definition.initial;
    this.stateNames = new Set(definition.states.map((s) => s.name));
    this.transitionDefs = definition.transitions;

    if (!this.stateNames.has(this.initial)) {
      throw new Error(
        `invalid definition: initial state "${this.initial}" is not in states list`,
      );
    }

    for (const t of this.transitionDefs) {
      if (!this.stateNames.has(t.from)) {
        throw new Error(
          `invalid definition: transition references unknown state "${t.from}"`,
        );
      }
      if (!this.stateNames.has(t.to)) {
        throw new Error(
          `invalid definition: transition references unknown state "${t.to}"`,
        );
      }
    }
  }

  transition(ctx: TransitionContext, to: string): TransitionResult {
    const from = ctx.record.state;

    if (!this.stateNames.has(from)) {
      return { ok: false, from, to, reason: `unknown state "${from}"` };
    }

    const def = this.transitionDefs.find((t) => t.from === from && t.to === to);
    if (!def) {
      return {
        ok: false,
        from,
        to,
        reason: `no transition from "${from}" to "${to}"`,
      };
    }

    if (def.guards) {
      for (const guard of def.guards) {
        if (!guard.check(ctx)) {
          return {
            ok: false,
            from,
            to,
            reason: `guard "${guard.name}" rejected transition`,
          };
        }
      }
    }

    const effectNames: string[] = [];
    if (def.effects) {
      for (const effect of def.effects) {
        effect.execute(ctx);
        effectNames.push(effect.name);
      }
    }

    return { ok: true, from, to, effects: effectNames };
  }

  states(): string[] {
    return [...this.stateNames];
  }

  transitionsFrom(state: string): string[] {
    return this.transitionDefs
      .filter((t) => t.from === state)
      .map((t) => t.to);
  }

  canTransition(from: string, to: string): boolean {
    return this.transitionDefs.some((t) => t.from === from && t.to === to);
  }
}
