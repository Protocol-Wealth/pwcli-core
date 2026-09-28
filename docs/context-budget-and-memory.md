# Context budgets and memory boundaries

Reviewed 2026-09-28. This is guidance for runtime adapters, not a new memory
service or a change to the [intent specification](../SPEC.md). Context packs
remain small, reviewed operating references; they are not live user memory.

## Before an agent run

1. Declare the effective model context limit and a budget for instructions,
   registered tool descriptions, retrieved sources, tool output, and the
   response. Reserve space for later steps and a handoff if the task is long.
2. Narrow retrieval by authorized principal, project, source rights, and time
   before ranking. Load a short candidate description before opening full
   records. Keep source IDs so the agent can request details on demand.
3. Keep raw tool output and transcripts out of run receipts. Record only the
   policy IDs, counts, digests, and bounded metrics described in
   [the runtime adapter guide](agent-runtime-adapters.md).

The [XDA local-agent report](https://www.xda-developers.com/stopped-my-local-llm-agent-from-running-out-of-context/)
shows why a runner's *configured* context limit matters: its author's agent
failed with a small setting and completed a multi-step task after changing
model-load settings. Hardware-specific numbers in that report are not default
recommendations. Official [LM Studio load documentation](https://lmstudio.ai/docs/developer/rest/load)
describes how to inspect the applied context length.

## When the window fills

Produce a bounded handoff containing the task objective, completed actions,
current state, source IDs, unresolved questions, and pending approvals. Link to
an authorized history store only when the successor is entitled to read it.
Do not assume that a summary can preserve every old fact: long-range recall
may require fetching the original source. The [JAZ paper](https://arxiv.org/html/2609.26891)
demonstrates a history-by-reference pattern in benchmark tasks; it is a
research result, not a substitute for authorization or retention controls.

## Memory operations need different gates

| Operation | Control-plane expectation |
| --- | --- |
| Retrieve | Enforce principal, scope, source rights, time, and prompt budget. |
| Record a new fact | Require source provenance, data classification, and write authorization. |
| Reflect or synthesize | Label the result as model interpretation; retain source links. |
| Update or forget | Preserve required audit evidence and enforce the relevant retention rule. |
| Promote a learned instruction | Present a diff and source to a reviewer before it enters a context pack or `AGENTS.md`. |

[MemU](https://github.com/NevaMind-AI/memU) and
[Letta Code](https://github.com/letta-ai/letta-code) illustrate why learned
skills and editable memory are useful. Their automatic learning patterns should
enter this specification only through registered, approved operations.
[OpenMemory](https://github.com/mem0ai/openmemory) illustrates selected
cross-harness session transfer; a transcript export is a data movement event,
not a harmless context shortcut. The [PWOS Core memory landscape](https://github.com/Protocol-Wealth/pwos-core/blob/main/docs/agent-memory-landscape.md)
links the broader reference set and evaluation questions.
