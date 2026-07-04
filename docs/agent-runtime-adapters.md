# Agent Runtime Adapters

`pwcli-core` is not an agent runtime. It is a control-plane contract that can
sit above existing agent infrastructure. The goal is to provide a broad starting
point for applications that want to use OpenAI Agents SDK, LangGraph, MCP
servers, A2A agents, Goose, Claude Code, or custom runtimes without giving up
intent telemetry, registered UI primitives, approvals, provenance, privacy, and
redaction boundaries.

## Principle

Use existing runtimes for execution. Use `pwcli-core` for governance.

- runtimes own loops, tools, streaming, sessions, handoffs, persistence, and
  local or remote execution;
- `pwcli-core` owns intent shape, primitive selection, side-effect metadata,
  approval requirements, source/assertion separation, artifact provenance, and
  data boundary declarations.

## Runtime Fit

| Runtime | Use it for | `pwcli-core` control-plane layer |
| --- | --- | --- |
| OpenAI Agents SDK | Managed agent loops, tools, handoffs, guardrails, sessions, tracing, MCP, and human-in-loop workflows. | Intent payloads, approval policy, primitive mapping, redaction before model/tool calls. |
| LangGraph | Long-running stateful workflows, persistence, human-in-loop, memory, streaming, and durable orchestration. | State-machine contracts, replayable artifacts, provenance, and UI return-focus semantics. |
| MCP server | Standard agent-to-tool or agent-to-data access. | Tool permission metadata, data classification, source records, redaction, and audit requirements. |
| A2A agent | Agent-to-agent discovery, delegation, and result exchange. | Agent-card-lite mapping, delegation approval, trust boundary, and provenance of delegated work. |
| Goose | Local-first desktop, CLI, API, provider-flexible agent execution, and MCP extension use. | Local data boundaries, approval gates, run receipts, and redaction before external provider calls. |
| Claude Code | Repo automation, code review, coding sessions, instructions, skills, hooks, and MCP-connected development workflows. | AGENTS/CLAUDE instruction discipline, review gates, PR artifact contracts, and privacy-safe context packs. |

## Adapter Contract

Use `schemas/runtime-adapter.schema.json` to describe any runtime you connect.
Each adapter should declare:

- runtime kind;
- local, remote, sandboxed, managed, or hybrid execution mode;
- data access;
- allowed data classes;
- side-effect level;
- approval, audit, and redaction requirements;
- integration boundary;
- redaction policy references;
- untrusted input policy for prompt poisoning and agent poisoning defense.

The adapter is metadata first. It should not grant permissions by itself. The
host application must still enforce auth, policy, and data boundaries at
runtime.

## Recommended Pattern

1. Compile human input into `intent.schema.json`.
2. Select registered primitives from `primitive.schema.json`.
3. Select a runtime adapter only if its data classes and side-effect level match
   the intent and policy.
4. Apply redaction policy before prompts, tools, artifacts, external calls, logs,
   or memory writes.
5. Treat external text and tool output as untrusted data, not instructions.
6. Pause at an approval gate for state changes or sensitive data movement.
7. Write provenance and artifact records after execution.

## Non-Goal

`pwcli-core` should not clone these runtimes. It should make them safer and more
legible by standardizing the envelope around them.
