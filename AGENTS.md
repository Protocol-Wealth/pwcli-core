# AGENTS.md

This repository defines `pwcli-core`, an open specification for
intent-driven, dual-engine applications.

## Agent Operating Rules

- Read `README.md`, `SPEC.md`, and `prompts/architecture-engine.md` first.
- Keep examples generic and synthetic.
- Do not add secrets, credentials, or real personal/commercial data.
- Prefer open standards before custom schemas.
- Keep AI interpretation separate from source metadata.
- Do not add runtime dependencies unless the change explicitly introduces a
  validator or example app.
- Run `npm run validate` after editing schemas, crosswalks, context packs, docs, public metadata, or workflow files.

## Important Files

- `schemas/intent.schema.json`: central intent payload contract.
- `schemas/primitive.schema.json`: registered panel/component contract.
- `schemas/source.schema.json`: source metadata and provenance entry point.
- `docs/standards-map.md`: standards maturity map.
- `docs/context-packs.md`: context-pack guidance.

## Expected Checks

For docs/spec/schema changes:

```bash
npm run validate
```

The validator includes JSON parsing, schema metadata checks, crosswalk shape checks, context-pack frontmatter checks, local Markdown link checks, ASCII/LF/trailing-whitespace hygiene, required public markers, simple secret scans, and workflow presence checks.
