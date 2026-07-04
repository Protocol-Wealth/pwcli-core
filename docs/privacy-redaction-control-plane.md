# Privacy and Redaction Control Plane

AI applications are useful only when they can touch real context. That makes
privacy and data boundaries a first-class design concern. `pwcli-core` treats
redaction as part of the control plane, not as a last-minute filter.

## Goal

Provide a broad starting point for privacy-aware agent applications that need to
route data through local tools, remote models, MCP servers, agent runtimes, or
document workflows while keeping sensitive information governed.

## Data Classes

Use these classes consistently across runtime adapters, source records, tools,
and artifacts:

- `public`
- `internal`
- `confidential`
- `restricted`
- `pii`
- `financial`
- `health`
- `child_minor`
- `secrets`

## Redaction Stages

Redaction should be declared before the system moves data across a boundary:

- `before_prompt`
- `before_tool`
- `before_artifact`
- `before_external_call`
- `before_memory_write`
- `before_log`

## Actions

Policies can declare one or more actions:

- `allow`
- `mask`
- `hash`
- `tokenize`
- `summarize`
- `block`
- `require_approval`

## Assertion Separation

Do not overwrite descriptive source metadata with AI interpretation. If a model
infers a person, account, diagnosis, financial fact, or family detail, store
that as interpretive output with confidence and provenance. Keep source claims
separate.

## Local-First Bias

For sensitive or family-like data, prefer this order:

1. local deterministic parser or redactor;
2. local model or sandboxed runtime;
3. remote model with redacted context;
4. remote tool only after explicit approval and audit tagging.

## Runnable Demo

See [examples/adapter-control-demo](../examples/adapter-control-demo/README.md) for a concrete redaction-policy flow before prompt, tool, artifact, log, and memory boundaries.

## Policy Contract

Use `schemas/redaction-policy.schema.json` to describe:

- scope;
- data classes;
- redaction stages;
- actions;
- default handling;
- human review requirement;
- audit requirement;
- retention expectations;
- applicable runtime adapters.

The policy document is not enough by itself. Host applications must enforce it
in code and should test representative examples.
