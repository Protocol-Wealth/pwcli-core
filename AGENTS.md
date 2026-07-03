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
- Validate JSON files after editing.

## Important Files

- `schemas/intent.schema.json`: central intent payload contract.
- `schemas/primitive.schema.json`: registered panel/component contract.
- `schemas/source.schema.json`: source metadata and provenance entry point.
- `docs/standards-map.md`: standards maturity map.
- `docs/context-packs.md`: context-pack guidance.

## Expected Checks

For docs-only changes:

```bash
git diff --check
node -e "for (const f of require('fs').readdirSync('schemas')) JSON.parse(require('fs').readFileSync('schemas/'+f,'utf8'))"
```
