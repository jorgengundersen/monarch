import { randomUUID } from "node:crypto";

// --- Core types ---

export interface ActorRef {
  kind: "agent" | "human";
  id: string;
}

export interface Relationship {
  target: string;
  kind: string;
}

export interface Record {
  id: string;
  type: string;
  state: string;
  title: string;
  body: string;
  metadata: { [key: string]: unknown };
  relationships: Relationship[];
  created_by: ActorRef;
  assigned_to?: ActorRef;
  origin?: string;
  created_at: Date;
  updated_at: Date;
}

// --- Type schemas ---

export interface MetadataFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
}

export interface RecordTypeSchema {
  type: string;
  metadata_schema: { [field: string]: MetadataFieldSchema };
  default_state: string;
}

// --- Factory ---

export interface CreateRecordInput {
  type: string;
  title: string;
  body: string;
  created_by: ActorRef;
  assigned_to?: ActorRef;
  origin?: string;
  metadata?: { [key: string]: unknown };
  relationships?: Relationship[];
  state?: string;
}

export function createRecord(input: CreateRecordInput): Record {
  const now = new Date();
  return {
    id: randomUUID(),
    type: input.type,
    state: input.state ?? "open",
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
    relationships: input.relationships ?? [],
    created_by: input.created_by,
    assigned_to: input.assigned_to,
    origin: input.origin,
    created_at: now,
    updated_at: now,
  };
}

// --- Validation ---

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecord(record: Record): ValidationResult {
  const errors: string[] = [];

  if (!record.id) errors.push("id is required");
  if (!record.type) errors.push("type is required");
  if (!record.title) errors.push("title is required");
  if (!record.created_by?.id) errors.push("created_by.id is required");

  for (const rel of record.relationships) {
    if (!rel.target) errors.push("relationship target is required");
    if (!rel.kind) errors.push("relationship kind is required");
  }

  return { valid: errors.length === 0, errors };
}

// --- Default record types ---

export const DEFAULT_RECORD_TYPES: RecordTypeSchema[] = [
  {
    type: "task",
    default_state: "reported",
    metadata_schema: {
      acceptance_criteria: { type: "string", required: false },
      priority: { type: "number", required: false },
    },
  },
  {
    type: "bug",
    default_state: "reported",
    metadata_schema: {
      severity: { type: "string", required: false },
      reproduction_steps: { type: "string", required: false },
      discovered_during: { type: "string", required: false },
    },
  },
  {
    type: "message",
    default_state: "draft",
    metadata_schema: {
      sender: { type: "string", required: true },
      recipient: { type: "string", required: false },
      message_kind: { type: "string", required: false },
      blocking: { type: "boolean", required: false },
    },
  },
  {
    type: "feature",
    default_state: "reported",
    metadata_schema: {
      requester: { type: "string", required: false },
      rationale: { type: "string", required: false },
    },
  },
  {
    type: "incident",
    default_state: "reported",
    metadata_schema: {
      severity: { type: "string", required: true },
      impact: { type: "string", required: false },
      mitigation: { type: "string", required: false },
    },
  },
  {
    type: "discussion",
    default_state: "open",
    metadata_schema: {
      topic: { type: "string", required: false },
      participants: { type: "array", required: false },
    },
  },
  {
    type: "decision",
    default_state: "open",
    metadata_schema: {
      alternatives_considered: { type: "array", required: false },
      rationale: { type: "string", required: false },
      decided_by: { type: "string", required: false },
    },
  },
  {
    type: "maintenance",
    default_state: "reported",
    metadata_schema: {
      target: { type: "string", required: false },
      schedule: { type: "string", required: false },
    },
  },
];

// --- Default relationship kinds ---

export const DEFAULT_RELATIONSHIP_KINDS: string[] = [
  "parent",
  "child",
  "blocks",
  "blocked-by",
  "caused-by",
  "discovered-during",
  "responds-to",
  "related-to",
  "produces",
  "produced-by",
];
