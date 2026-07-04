# Agent and Prompt Poisoning Defense

Prompt injection and agent poisoning are control-plane failures, not just prompt
quality problems. Any issue body, pull request, document, web page, email, MCP
tool output, external agent result, or uploaded file can contain instructions
that attempt to override the operator's intent.

A June 2026 [Flatt Security writeup](https://flatt.tech/research/posts/poisoning-claude-code-one-github-issue-to-break-the-supply-chain/) showed how untrusted GitHub issue content
combined with powerful agent workflow permissions could lead to token
exfiltration and repository compromise. The specific product details will
change, but the control-plane lesson is stable: never let untrusted content
become trusted instructions while secrets, broad write permissions, network
egress, or public output sinks are available.

## Threat Model

Assume untrusted content may try to:

- impersonate system or tool errors;
- tell an agent to reveal secrets or environment variables;
- redirect tool calls to attacker-controlled endpoints;
- edit issues, comments, pull requests, or documents after a trusted trigger;
- chain a low-privilege workflow into a high-privilege workflow;
- poison summaries, run logs, artifacts, or memory;
- hide malicious instructions inside source-like text or metadata.

## Required Defenses

### 1. Label untrusted input as data

Quote or wrap untrusted content and explicitly state that it is data, not
instructions. The agent may summarize or classify it, but must not obey commands
inside it.

### 2. Verify actors and triggers

Do not let bots, arbitrary apps, anonymous users, or public contributors trigger
state-changing agent workflows. Prefer `trusted_human_only` triggers for
write-capable runs.

### 3. Split read and write workflows

Do not process public input in the same job that has broad write permissions,
OIDC token exchange, deployment authority, or repository mutation rights.

### 4. Remove secrets from untrusted-input jobs

Jobs that read public issues, comments, pull requests, web pages, or uploaded
documents should not receive secrets. If a secret is not present, it cannot be
exfiltrated through prompt injection.

### 5. Minimize token permissions

Use least-privilege tokens. Avoid `id-token: write`, repository write access,
workflow write access, or broad issue/PR write permissions in jobs that process
untrusted text.

### 6. Restrict network egress and tool arguments

Wrap CLI tools and MCP tools so they cannot use arbitrary URLs, file paths, or
command arguments as exfiltration channels. Prefer numeric IDs, allowlists, and
strict argument schemas.

### 7. Snapshot inputs

Record immutable input snapshots at trigger time. Ignore or re-review content
that changes after a trusted actor creates or approves it.

### 8. Control output sinks

Run summaries, comments, labels, artifacts, logs, and memory writes are output
sinks. Treat them as possible exfiltration paths and apply redaction before
writing.

### 9. Require approval for mutation

Any state-changing action should pause at an approval gate unless the workflow
is fully deterministic, low-risk, and bounded by policy.

### 10. Preserve provenance

Store where the input came from, who triggered the workflow, what tools were
allowed, what data classes were present, which redaction policy ran, and what
artifact was produced.

## Runtime Adapter Metadata

Use the `untrustedInputPolicy` field in
`schemas/runtime-adapter.schema.json` to declare:

- untrusted input sources;
- trigger policy;
- whether secrets may be exposed;
- network egress policy;
- token permissions;
- poisoning defenses.

## Related References

`pwos-core` can be a reference for privacy, compliance, audit, and AI safety
harness patterns. `iocalc-agent-env` can be a reference testbed for agent
environment and simulation patterns. They are references, not dependencies.
