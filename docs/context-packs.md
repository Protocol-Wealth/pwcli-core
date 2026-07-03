# Context Packs

A `context-pack/` directory stores small Markdown files with YAML frontmatter.
It is an agent-loadable operating context, not a source-of-truth database.

## Use Cases

- architecture principles;
- domain vocabulary;
- workflow conventions;
- standards references;
- project-specific guardrails.

## Frontmatter

Use `schemas/context-pack.schema.json` for the intended frontmatter shape.

```yaml
id: principles
type: specification_docs
title: pwcli-core First Principles
status: active
version: 1.0.0
domain: architecture
maturity: pattern_only
provenance: repo-authored public scaffold
sensitivity: public
lastReviewed: 2026-07-03
```

## Rules

- Keep files small.
- Link related files explicitly.
- Do not store secrets.
- Do not store private user data.
- Review context packs like code because agents may follow them.
