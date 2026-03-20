import type { StateMachineDefinition } from "./types.js";

export const DEFAULT_STATE_MACHINES: StateMachineDefinition[] = [
  {
    type: "task",
    initial: "reported",
    states: [
      { name: "reported", description: "Raw discovery, unverified, unscoped" },
      {
        name: "triaged",
        description:
          "Verified as real, needs scoping and acceptance criteria",
      },
      {
        name: "ready",
        description:
          "Fully scoped, acceptance criteria defined, available for assignment",
      },
      { name: "assigned", description: "Claimed by an agent" },
      { name: "in_progress", description: "Actively being worked on" },
      { name: "complete", description: "Work finished, pending verification" },
      {
        name: "review_requested",
        description: "Review has been requested",
      },
      { name: "approved", description: "Review approved" },
      { name: "done", description: "Verified and closed" },
    ],
    transitions: [
      { from: "reported", to: "triaged" },
      { from: "triaged", to: "ready" },
      { from: "ready", to: "assigned" },
      { from: "assigned", to: "in_progress" },
      { from: "in_progress", to: "complete" },
      { from: "in_progress", to: "review_requested" },
      { from: "review_requested", to: "approved" },
      { from: "complete", to: "done" },
      { from: "approved", to: "done" },
    ],
  },
  {
    type: "bug",
    initial: "reported",
    states: [
      { name: "reported", description: "Newly reported bug" },
      { name: "confirmed", description: "Bug verified as real" },
      { name: "not_a_bug", description: "Determined not to be a bug" },
      { name: "ready", description: "Ready for assignment" },
      { name: "assigned", description: "Claimed by an agent" },
      { name: "fixing", description: "Fix in progress" },
      { name: "fixed", description: "Fix applied, awaiting verification" },
      { name: "verified", description: "Fix verified" },
      { name: "closed", description: "Bug resolved and closed" },
      { name: "reopen", description: "Reopened after verification failed" },
    ],
    transitions: [
      { from: "reported", to: "confirmed" },
      { from: "confirmed", to: "ready" },
      { from: "confirmed", to: "not_a_bug" },
      { from: "ready", to: "assigned" },
      { from: "assigned", to: "fixing" },
      { from: "fixing", to: "fixed" },
      { from: "fixed", to: "verified" },
      { from: "verified", to: "closed" },
      { from: "verified", to: "reopen" },
      { from: "reopen", to: "assigned" },
    ],
  },
  {
    type: "message",
    initial: "draft",
    states: [
      { name: "draft", description: "Message being composed" },
      { name: "sent", description: "Message sent" },
      { name: "delivered", description: "Message delivered to recipient" },
      { name: "read", description: "Message read by recipient" },
      { name: "responded", description: "Recipient has responded" },
      { name: "closed", description: "Conversation closed" },
    ],
    transitions: [
      { from: "draft", to: "sent" },
      { from: "sent", to: "delivered" },
      { from: "delivered", to: "read" },
      { from: "read", to: "responded" },
      { from: "read", to: "closed" },
    ],
  },
  {
    type: "feature",
    initial: "reported",
    states: [
      { name: "reported", description: "Feature requested" },
      { name: "triaged", description: "Request reviewed and prioritized" },
      { name: "approved", description: "Feature approved for work" },
      { name: "in_progress", description: "Implementation underway" },
      { name: "done", description: "Feature complete" },
      { name: "rejected", description: "Feature request rejected" },
    ],
    transitions: [
      { from: "reported", to: "triaged" },
      { from: "triaged", to: "approved" },
      { from: "triaged", to: "rejected" },
      { from: "approved", to: "in_progress" },
      { from: "in_progress", to: "done" },
    ],
  },
  {
    type: "incident",
    initial: "reported",
    states: [
      { name: "reported", description: "Incident reported" },
      { name: "investigating", description: "Under investigation" },
      { name: "mitigating", description: "Mitigation in progress" },
      { name: "resolved", description: "Incident resolved" },
      { name: "closed", description: "Post-mortem complete, incident closed" },
    ],
    transitions: [
      { from: "reported", to: "investigating" },
      { from: "investigating", to: "mitigating" },
      { from: "mitigating", to: "resolved" },
      { from: "resolved", to: "closed" },
    ],
  },
  {
    type: "discussion",
    initial: "open",
    states: [
      { name: "open", description: "Discussion is active" },
      { name: "closed", description: "Discussion concluded" },
    ],
    transitions: [{ from: "open", to: "closed" }],
  },
  {
    type: "decision",
    initial: "open",
    states: [
      { name: "open", description: "Decision pending" },
      { name: "decided", description: "Decision made" },
      { name: "superseded", description: "Replaced by a later decision" },
    ],
    transitions: [
      { from: "open", to: "decided" },
      { from: "decided", to: "superseded" },
    ],
  },
  {
    type: "maintenance",
    initial: "reported",
    states: [
      { name: "reported", description: "Maintenance needed" },
      { name: "scheduled", description: "Maintenance scheduled" },
      { name: "in_progress", description: "Maintenance underway" },
      { name: "done", description: "Maintenance complete" },
    ],
    transitions: [
      { from: "reported", to: "scheduled" },
      { from: "scheduled", to: "in_progress" },
      { from: "in_progress", to: "done" },
    ],
  },
];
