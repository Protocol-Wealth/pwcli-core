# Adapter Control Demo

Synthetic runnable example for the `pwcli-core` runtime-adapter and redaction
control-plane pattern. It is browser-only: no build step, no backend, no model
calls, no external dependencies, and no real secrets.

Open `index.html` in a modern browser.

## What It Demonstrates

1. Untrusted issue or document text is boxed as data, not instructions.
2. The parser compiles the request into intent telemetry.
3. The control plane selects a runtime adapter from a static registry.
4. A redaction policy declares controls before prompts, tools, artifacts, external calls, logs, and memory writes.
5. State-changing workflows pause at an approval gate.
6. Approval creates a schema-faithful provenance record, a local run receipt, and a small synthetic artifact.
7. Source assertions remain separate from interpretive AI-style output.

The example uses a poisoned GitHub issue and an uploaded family document because
those flows make prompt-injection, redaction, and output-sink control easy to
see. Real implementations should replace the tiny parser with a validated model
or typed service only after preserving the same policy envelope.

## Files

- `index.html` - static page shell.
- `styles.css` - small local visual layer.
- `demo.js` - deterministic parser, adapter registry, redaction policy, approval gate, and receipt writer.
- `fixtures/` - JSON fixtures for intent, primitive, source, and provenance records.

## Safety Boundary

This demo does not execute external tools, call models, write files, or send
network requests. The runtime adapter and redaction policy are metadata only.
The approval button writes a local in-memory receipt so the control-plane flow
is visible without granting authority.
