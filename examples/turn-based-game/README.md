# Turn-Based Game Intent Demo

Synthetic runnable example for the `pwcli-core` dual-engine pattern. It is a
small browser-only demo: no build step, no backend, no model calls, and no
external dependencies.

Open `index.html` in a modern browser.

## What It Demonstrates

1. Human command text is lossy.
2. The parser compiles it into an intent telemetry object.
3. The app selects a registered primitive from a static registry.
4. The preview panel shows cost, risk, fallback route, and source references.
5. A state-changing action pauses at an approval gate.
6. The deterministic engine writes a ledger event.
7. Advisor interpretation is displayed separately from deterministic state.

The example uses turn-based game language because games make irreversible
commits, costs, and preview UX easy to see. The same pattern applies to
archives, finance workbenches, household workflows, care portals, and other
high-integrity apps.

## Files

- `index.html` - static page shell.
- `styles.css` - small local visual layer.
- `demo.js` - deterministic parser, primitive registry, state machine, and ledger.
- `fixtures/` - JSON fixtures for intent, primitive, source, provenance, and result.
- `schemas/` - example-local schema for the result ledger fixture.

## Safety Boundary

This demo does not let AI generate UI or mutate state. The parser is a tiny
keyword heuristic so the state machine is easy to inspect. A real implementation
can swap in a model parser, BAML-style parser, MCP tool, or typed API as long as
the output is validated before it reaches the deterministic engine.
