# Claude Agent SDK Reference Adapters

Equivalent Python and TypeScript examples that put the official Claude Agent
SDK behind the `pwcli-core` intent, policy, redaction, tool-gate, and receipt
boundary.

Reviewed against the official SDK docs and upstream releases on 2026-07-25:

- Python SDK `0.2.128`
- TypeScript SDK `0.3.220`
- [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- [Hooks](https://code.claude.com/docs/en/agent-sdk/hooks)
- [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)

The TypeScript example also pins `@hono/node-server` `2.0.10` through an npm
override because the SDK's MCP dependency otherwise resolves versions covered
by published path-traversal and WebSocket denial-of-service advisories. The
adapter does not enable MCP in this milestone, but the installed tree should
still remain clean under `npm audit --omit=dev`.

## What This Milestone Implements

Both adapters provide the same read-only one-shot path:

1. Compile and validate the shared intent, runtime-adapter, and redaction-policy
   fixtures, then select the language-specific adapter.
2. Require API-key or documented cloud-provider authentication without reading
   or retaining the credential value.
3. Redact simple secret and direct-identifier patterns before the prompt.
4. Expose only `Read`, `Glob`, and `Grep`.
5. Use `dontAsk`, an explicit tool list, disallowed mutating/network tools, and
   a `PreToolUse` gate.
6. Canonicalize file-bearing tool arguments and deny absolute paths, traversal,
   home aliases, sensitive files, and symlinks that resolve outside `cwd`.
7. Redact tool output through `PostToolUse` before it returns to the model.
   The hook always wraps repository output as untrusted data, and the system
   prompt says never to follow instructions found in that data.
8. Record `approval.decision = not_required` only for the exact read-only
   intent, and deny any other intent before the SDK loop.
9. Emit a content-minimized receipt with timestamps, policy identifiers,
   finding counts, tool-event counts, and a result hash.

The receipt never contains the prompt, model output, tool arguments, file
contents, credential values, or SDK transcript. That receipt boundary does not
control the SDK's own session files: the TypeScript adapter sets
`persistSession: false`; the Python SDK always persists sessions, so the Python
adapter points `CLAUDE_CONFIG_DIR` at a per-run temporary directory and removes
it when the query closes. Both disable automatic memory for the SDK subprocess.

## Authentication Boundary

The examples support the methods documented for third-party Agent SDK
applications:

- `ANTHROPIC_API_KEY`
- Amazon Bedrock
- Claude Platform on AWS
- Google Cloud's Agent Platform / Vertex
- Microsoft Foundry

They do not extract Claude Code credentials, reuse subscription tokens, or
offer claude.ai login. Anthropic's Agent SDK overview says third-party
developers should use the documented API-key or cloud-provider paths unless
Anthropic has separately approved claude.ai login.

## Python

```bash
cd examples/claude-agent-sdk-adapters/python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install .
ANTHROPIC_API_KEY=your-key \
  pwcli-claude-review "Review this repository for broken local links" --cwd ../../..
```

## TypeScript

```bash
cd examples/claude-agent-sdk-adapters/typescript
npm install
ANTHROPIC_API_KEY=your-key \
  npm run review -- "Review this repository for broken local links" --cwd ../../..
```

Do not paste credentials into prompts, command history, fixtures, or receipt
files. Use the normal secret-management path for the environment in which the
adapter runs.

## Tests Without Provider Calls

The dependency-free repository validator runs both suites with injected fake
query functions. No SDK package, API credential, model call, or network access
is required:

```bash
npm run validate
```

The tests verify:

- prompts and outputs are redacted;
- mutating tools, sensitive paths, traversal, absolute paths, home aliases, and
  symlink escapes are denied;
- shared fixtures compile into the selected adapter and redaction policy;
- the approval seam fails closed for any non-read-only intent;
- missing documented authentication fails closed;
- success, denial, and failure receipts meet the run-receipt schema contract;
- receipts do not retain prompts, output, tool arguments, or credentials;
- the Python and TypeScript paths produce the same policy evidence.

## Security Boundary

`permissionMode: "dontAsk"`, tool lists, and hooks are policy controls. They are
not an operating-system sandbox. The `networkEgressPolicy: "none"` receipt field
means agent tools are not granted web or shell egress; the SDK still needs
provider API traffic. A real deployment must separately enforce filesystem,
process, credential, and network isolation at the host, container, VM, or
sandbox layer.

The deterministic redactor is a tripwire, not proof that arbitrary content is
de-identified. These examples are restricted to synthetic prompts and public
repository content. Hosted use additionally requires per-tenant credentials,
work directories, configuration/session directories, egress policy, and
transcript retention; this local reference does not provide that isolation.

## Deferred Work

This milestone intentionally does not add edit/write/Bash tools, interactive
approvals, REPL/session resume, MCP, subagents, semantic memory, sandbox
provisioning, remote access, production credentials, or unattended mutation.
The exit evidence for later milestones is explicit:

| Later milestone | Required evidence before release |
| --- | --- |
| Mutating tools | Typed mutation intent and adapter fixture, external approval decision, OS-level sandbox/egress tests, rollback or compensating-action receipt, and adversarial denial tests. |
| MCP or subagents | Server/agent identity and capability allowlists, delegated-data provenance, nested approval behavior, and poisoned-tool-output tests. |
| Sessions or memory | Separate runtime, conversation, approval, and audit state types; tenant-scoped storage; documented retention/deletion; resume and cross-tenant isolation tests. |
| Hosted or remote execution | Per-tenant credentials, work directory, config/session directory, transcript boundary, egress policy, audit sink, and verified teardown. |
