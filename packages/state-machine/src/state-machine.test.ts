import { describe, it, expect, vi } from "vitest";
import type {
  StateMachineDefinition,
  TransitionContext,
  GuardCondition,
  TransitionEffect,
} from "./types.js";
import { StateMachine } from "./state-machine.js";

const simpleDef: StateMachineDefinition = {
  type: "task",
  initial: "open",
  states: [
    { name: "open", description: "Newly created" },
    { name: "in_progress", description: "Being worked on" },
    { name: "done", description: "Completed" },
  ],
  transitions: [
    { from: "open", to: "in_progress" },
    { from: "in_progress", to: "done" },
  ],
};

function makeCtx(state: string): TransitionContext {
  return { record: { id: "rec-1", type: "task", state } };
}

describe("StateMachine", () => {
  describe("construction", () => {
    it("creates from a valid definition", () => {
      const sm = new StateMachine(simpleDef);
      expect(sm.type).toBe("task");
      expect(sm.initial).toBe("open");
    });

    it("rejects definition where initial state is not in states list", () => {
      const bad: StateMachineDefinition = {
        ...simpleDef,
        initial: "nonexistent",
      };
      expect(() => new StateMachine(bad)).toThrow("initial state");
    });

    it("rejects transition referencing unknown state", () => {
      const bad: StateMachineDefinition = {
        ...simpleDef,
        transitions: [{ from: "open", to: "unknown" }],
      };
      expect(() => new StateMachine(bad)).toThrow("unknown state");
    });
  });

  describe("transition", () => {
    it("allows a valid transition", () => {
      const sm = new StateMachine(simpleDef);
      const result = sm.transition(makeCtx("open"), "in_progress");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.from).toBe("open");
        expect(result.to).toBe("in_progress");
      }
    });

    it("rejects an invalid transition", () => {
      const sm = new StateMachine(simpleDef);
      const result = sm.transition(makeCtx("open"), "done");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("no transition");
      }
    });

    it("rejects transition from unknown current state", () => {
      const sm = new StateMachine(simpleDef);
      const result = sm.transition(makeCtx("nonexistent"), "open");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("unknown state");
      }
    });
  });

  describe("guards", () => {
    it("allows transition when guard passes", () => {
      const guard: GuardCondition = {
        name: "always-pass",
        check: () => true,
      };
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [{ from: "open", to: "in_progress", guards: [guard] }],
      };
      const sm = new StateMachine(def);
      const result = sm.transition(makeCtx("open"), "in_progress");
      expect(result.ok).toBe(true);
    });

    it("rejects transition when guard fails", () => {
      const guard: GuardCondition = {
        name: "needs-assignee",
        check: () => false,
      };
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [{ from: "open", to: "in_progress", guards: [guard] }],
      };
      const sm = new StateMachine(def);
      const result = sm.transition(makeCtx("open"), "in_progress");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("needs-assignee");
      }
    });

    it("checks all guards and reports first failure", () => {
      const guards: GuardCondition[] = [
        { name: "first", check: () => true },
        { name: "second", check: () => false },
      ];
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [{ from: "open", to: "in_progress", guards }],
      };
      const sm = new StateMachine(def);
      const result = sm.transition(makeCtx("open"), "in_progress");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("second");
      }
    });
  });

  describe("effects", () => {
    it("executes effects on successful transition", () => {
      const execute = vi.fn();
      const effect: TransitionEffect = { name: "log-it", execute };
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [{ from: "open", to: "in_progress", effects: [effect] }],
      };
      const sm = new StateMachine(def);
      const ctx = makeCtx("open");
      const result = sm.transition(ctx, "in_progress");
      expect(result.ok).toBe(true);
      expect(execute).toHaveBeenCalledWith(ctx);
    });

    it("does not execute effects when guard fails", () => {
      const execute = vi.fn();
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [
          {
            from: "open",
            to: "in_progress",
            guards: [{ name: "block", check: () => false }],
            effects: [{ name: "should-not-run", execute }],
          },
        ],
      };
      const sm = new StateMachine(def);
      sm.transition(makeCtx("open"), "in_progress");
      expect(execute).not.toHaveBeenCalled();
    });

    it("returns effect names in success result", () => {
      const def: StateMachineDefinition = {
        ...simpleDef,
        transitions: [
          {
            from: "open",
            to: "in_progress",
            effects: [
              { name: "effect-a", execute: () => {} },
              { name: "effect-b", execute: () => {} },
            ],
          },
        ],
      };
      const sm = new StateMachine(def);
      const result = sm.transition(makeCtx("open"), "in_progress");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.effects).toEqual(["effect-a", "effect-b"]);
      }
    });
  });

  describe("introspection", () => {
    it("lists all states", () => {
      const sm = new StateMachine(simpleDef);
      expect(sm.states()).toEqual(["open", "in_progress", "done"]);
    });

    it("lists valid transitions from a state", () => {
      const sm = new StateMachine(simpleDef);
      expect(sm.transitionsFrom("open")).toEqual(["in_progress"]);
      expect(sm.transitionsFrom("in_progress")).toEqual(["done"]);
      expect(sm.transitionsFrom("done")).toEqual([]);
    });

    it("checks if a transition is structurally valid (ignoring guards)", () => {
      const sm = new StateMachine(simpleDef);
      expect(sm.canTransition("open", "in_progress")).toBe(true);
      expect(sm.canTransition("open", "done")).toBe(false);
    });
  });
});
