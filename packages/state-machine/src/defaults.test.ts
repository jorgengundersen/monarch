import { describe, it, expect } from "vitest";
import { DEFAULT_STATE_MACHINES } from "./defaults.js";
import { StateMachine } from "./state-machine.js";

describe("default state machines", () => {
  it("provides definitions for all built-in record types", () => {
    const types = DEFAULT_STATE_MACHINES.map((d) => d.type);
    expect(types).toContain("task");
    expect(types).toContain("bug");
    expect(types).toContain("message");
    expect(types).toContain("feature");
    expect(types).toContain("incident");
    expect(types).toContain("discussion");
    expect(types).toContain("decision");
    expect(types).toContain("maintenance");
  });

  it("all definitions are valid (can construct StateMachine)", () => {
    for (const def of DEFAULT_STATE_MACHINES) {
      expect(() => new StateMachine(def)).not.toThrow();
    }
  });

  describe("task state machine", () => {
    const sm = new StateMachine(
      DEFAULT_STATE_MACHINES.find((d) => d.type === "task")!,
    );

    it("starts at reported", () => {
      expect(sm.initial).toBe("reported");
    });

    it("follows happy path: reported -> triaged -> ready -> assigned -> in_progress -> complete -> done", () => {
      const path = [
        "reported",
        "triaged",
        "ready",
        "assigned",
        "in_progress",
        "complete",
        "done",
      ];
      for (let i = 0; i < path.length - 1; i++) {
        expect(sm.canTransition(path[i], path[i + 1])).toBe(true);
      }
    });

    it("supports review path from in_progress", () => {
      expect(sm.canTransition("in_progress", "review_requested")).toBe(true);
      expect(sm.canTransition("review_requested", "approved")).toBe(true);
      expect(sm.canTransition("approved", "done")).toBe(true);
    });

    it("does not allow skipping states", () => {
      expect(sm.canTransition("reported", "done")).toBe(false);
      expect(sm.canTransition("open", "done")).toBe(false);
    });
  });

  describe("bug state machine", () => {
    const sm = new StateMachine(
      DEFAULT_STATE_MACHINES.find((d) => d.type === "bug")!,
    );

    it("starts at reported", () => {
      expect(sm.initial).toBe("reported");
    });

    it("follows happy path to closed", () => {
      const path = [
        "reported",
        "confirmed",
        "ready",
        "assigned",
        "fixing",
        "fixed",
        "verified",
        "closed",
      ];
      for (let i = 0; i < path.length - 1; i++) {
        expect(sm.canTransition(path[i], path[i + 1])).toBe(true);
      }
    });

    it("supports not_a_bug from confirmed", () => {
      expect(sm.canTransition("confirmed", "not_a_bug")).toBe(true);
    });

    it("supports reopen from verified", () => {
      expect(sm.canTransition("verified", "reopen")).toBe(true);
      expect(sm.canTransition("reopen", "assigned")).toBe(true);
    });
  });

  describe("message state machine", () => {
    const sm = new StateMachine(
      DEFAULT_STATE_MACHINES.find((d) => d.type === "message")!,
    );

    it("starts at draft", () => {
      expect(sm.initial).toBe("draft");
    });

    it("follows happy path", () => {
      const path = ["draft", "sent", "delivered", "read", "responded"];
      for (let i = 0; i < path.length - 1; i++) {
        expect(sm.canTransition(path[i], path[i + 1])).toBe(true);
      }
    });

    it("supports closing from read", () => {
      expect(sm.canTransition("read", "closed")).toBe(true);
    });
  });
});
