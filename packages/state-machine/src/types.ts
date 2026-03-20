// --- State machine configuration format ---

/**
 * Context passed to guard conditions and transition effects.
 * Contains the record being transitioned and any additional data
 * the consumer provides.
 */
export interface TransitionContext {
  record: { id: string; type: string; state: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * A guard condition that must return true for a transition to proceed.
 * Guards are named for traceability — when a transition is rejected,
 * the guard's name is included in the error.
 */
export interface GuardCondition {
  name: string;
  check: (ctx: TransitionContext) => boolean;
}

/**
 * A side-effect that runs after a transition succeeds.
 * Effects are named for traceability and debugging.
 */
export interface TransitionEffect {
  name: string;
  execute: (ctx: TransitionContext) => void;
}

/**
 * A single allowed transition between two states.
 */
export interface TransitionDefinition {
  from: string;
  to: string;
  guards?: GuardCondition[];
  effects?: TransitionEffect[];
}

/**
 * A state within a state machine, with an optional description.
 */
export interface StateDefinition {
  name: string;
  description?: string;
}

/**
 * The complete, declarative definition of a state machine for a record type.
 * Consumers create these to define custom lifecycles.
 */
export interface StateMachineDefinition {
  type: string;
  initial: string;
  states: StateDefinition[];
  transitions: TransitionDefinition[];
}

// --- Transition results ---

export interface TransitionSuccess {
  ok: true;
  from: string;
  to: string;
  effects: string[];
}

export interface TransitionFailure {
  ok: false;
  from: string;
  to: string;
  reason: string;
}

export type TransitionResult = TransitionSuccess | TransitionFailure;
