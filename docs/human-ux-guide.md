# Human UX Guide

`pwcli-core` treats conversational UI as a focus-preserving control plane, not a
license to hide consequential state changes behind fluent text. The user should
see what the system inferred, what panel or route will hydrate, what costs or
risks matter, and what will happen after approval.

## Progressive Disclosure

Use three practical disclosure modes.

### Basic

Basic mode favors speed for low-risk or reversible work. It should still leave a
clear receipt after execution.

- read-only summaries can run directly;
- reversible idempotent mutations may use one-click confirmation;
- show concise source references and fallback routes after completion.

### Intermediate

Intermediate mode is the default for mixed human and AI workflows. It should
show an intent receipt before consequential work.

- display intent, confidence, side-effect level, and candidate primitive;
- show cost fields, risk labels, and likely output;
- require explicit approval for state changes;
- return focus with a deterministic ledger event and a separate interpretation.

### Advanced

Advanced mode favors auditability and operator control. It should expose
structured payloads and provenance.

- show the full intent telemetry payload;
- show source records separately from AI interpretations;
- expose fallback route and execution target metadata;
- require approval for irreversible or externally visible actions;
- keep replay and rollback policy visible.

## Primitive UX Fields

Registered primitives can include optional `ux` metadata in
`schemas/primitive.schema.json`. These fields do not execute behavior; they give
the host application predictable labels and empty/loading/error states.

Recommended fields:

- `primaryAction` for the approval button label;
- `previewFields` for deterministic values to show before execution;
- `riskLabels` for warnings, counterplay, privacy, or compliance notes;
- `costFields` for energy, money, time, quota, or approval costs;
- `emptyState`, `loadingState`, and `errorState` for bounded UI copy;
- `undoPolicy` for rollback expectations.

## Assertion Separation

Never mix factual ledger state with model interpretation. A preview panel may
show both, but it should label them separately:

- deterministic source or event ledger: what the state engine knows;
- advisor interpretation: what a model or heuristic inferred.

The deterministic ledger remains the source of truth.
