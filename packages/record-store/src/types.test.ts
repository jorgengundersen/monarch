import { describe, it, expect } from "vitest";
import {
  type Record,
  type Relationship,
  type ActorRef,
  type RecordTypeSchema,
  createRecord,
  validateRecord,
  DEFAULT_RECORD_TYPES,
  DEFAULT_RELATIONSHIP_KINDS,
} from "./types.js";

describe("Record data model", () => {
  describe("createRecord", () => {
    it("creates a record with required fields", () => {
      const record = createRecord({
        type: "task",
        title: "Fix login bug",
        body: "The login form crashes on empty input",
        created_by: { kind: "agent", id: "agent-1" },
      });

      expect(record.id).toBeDefined();
      expect(record.type).toBe("task");
      expect(record.state).toBe("open");
      expect(record.title).toBe("Fix login bug");
      expect(record.body).toBe("The login form crashes on empty input");
      expect(record.metadata).toEqual({});
      expect(record.relationships).toEqual([]);
      expect(record.created_by).toEqual({ kind: "agent", id: "agent-1" });
      expect(record.assigned_to).toBeUndefined();
      expect(record.origin).toBeUndefined();
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.updated_at).toBeInstanceOf(Date);
    });

    it("creates a record with optional fields", () => {
      const record = createRecord({
        type: "bug",
        title: "Token expiry off-by-one",
        body: "Tokens expire one second early",
        created_by: { kind: "human", id: "user-1" },
        assigned_to: { kind: "agent", id: "agent-2" },
        origin: "/projects/auth",
        metadata: { severity: "high", reproduction_steps: "1. Login 2. Wait" },
        relationships: [{ target: "rec-abc", kind: "discovered-during" }],
      });

      expect(record.type).toBe("bug");
      expect(record.assigned_to).toEqual({ kind: "agent", id: "agent-2" });
      expect(record.origin).toBe("/projects/auth");
      expect(record.metadata).toEqual({
        severity: "high",
        reproduction_steps: "1. Login 2. Wait",
      });
      expect(record.relationships).toEqual([
        { target: "rec-abc", kind: "discovered-during" },
      ]);
    });

    it("generates unique IDs", () => {
      const a = createRecord({
        type: "task",
        title: "A",
        body: "",
        created_by: { kind: "human", id: "u1" },
      });
      const b = createRecord({
        type: "task",
        title: "B",
        body: "",
        created_by: { kind: "human", id: "u1" },
      });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("validateRecord", () => {
    it("accepts a valid record", () => {
      const record = createRecord({
        type: "task",
        title: "Valid task",
        body: "Some body",
        created_by: { kind: "human", id: "u1" },
      });
      const result = validateRecord(record);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("rejects a record with empty id", () => {
      const record = createRecord({
        type: "task",
        title: "Test",
        body: "",
        created_by: { kind: "human", id: "u1" },
      });
      (record as any).id = "";
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("id is required");
    });

    it("rejects a record with empty type", () => {
      const record = createRecord({
        type: "task",
        title: "Test",
        body: "",
        created_by: { kind: "human", id: "u1" },
      });
      (record as any).type = "";
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("type is required");
    });

    it("rejects a record with empty title", () => {
      const record = createRecord({
        type: "task",
        title: "",
        body: "",
        created_by: { kind: "human", id: "u1" },
      });
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("title is required");
    });

    it("rejects a record with invalid actor ref", () => {
      const record = createRecord({
        type: "task",
        title: "Test",
        body: "",
        created_by: { kind: "human", id: "" },
      });
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("created_by.id is required");
    });

    it("rejects a record with invalid relationship", () => {
      const record = createRecord({
        type: "task",
        title: "Test",
        body: "",
        created_by: { kind: "human", id: "u1" },
        relationships: [{ target: "", kind: "parent" }],
      });
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("relationship target is required");
    });

    it("rejects a record with empty relationship kind", () => {
      const record = createRecord({
        type: "task",
        title: "Test",
        body: "",
        created_by: { kind: "human", id: "u1" },
        relationships: [{ target: "rec-1", kind: "" }],
      });
      const result = validateRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("relationship kind is required");
    });
  });

  describe("RecordTypeSchema", () => {
    it("validates metadata against a type schema", () => {
      const taskSchema: RecordTypeSchema = {
        type: "task",
        metadata_schema: {
          priority: { type: "number", required: false },
          acceptance_criteria: { type: "string", required: false },
        },
        default_state: "reported",
      };

      expect(taskSchema.type).toBe("task");
      expect(taskSchema.default_state).toBe("reported");
      expect(taskSchema.metadata_schema.priority).toEqual({
        type: "number",
        required: false,
      });
    });
  });

  describe("default record types", () => {
    it("includes all built-in types", () => {
      const typeNames = DEFAULT_RECORD_TYPES.map((t) => t.type);
      expect(typeNames).toContain("task");
      expect(typeNames).toContain("bug");
      expect(typeNames).toContain("message");
      expect(typeNames).toContain("feature");
      expect(typeNames).toContain("incident");
      expect(typeNames).toContain("discussion");
      expect(typeNames).toContain("decision");
      expect(typeNames).toContain("maintenance");
    });
  });

  describe("default relationship kinds", () => {
    it("includes all built-in kinds", () => {
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("parent");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("child");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("blocks");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("blocked-by");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("caused-by");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("discovered-during");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("responds-to");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("related-to");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("produces");
      expect(DEFAULT_RELATIONSHIP_KINDS).toContain("produced-by");
    });
  });

  describe("ActorRef", () => {
    it("supports agent actors", () => {
      const actor: ActorRef = { kind: "agent", id: "agent-42" };
      expect(actor.kind).toBe("agent");
      expect(actor.id).toBe("agent-42");
    });

    it("supports human actors", () => {
      const actor: ActorRef = { kind: "human", id: "user-7" };
      expect(actor.kind).toBe("human");
      expect(actor.id).toBe("user-7");
    });
  });
});
