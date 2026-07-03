# Contributing

Contributions are welcome when they keep the specification practical,
deterministic, and standards-aware.

## Contribution Licensing

By contributing, you agree that your contribution is licensed under
`MIT-0 OR Apache-2.0` unless you explicitly state otherwise in the contribution.

## Contribution Rules

- Prefer existing open standards before introducing a custom schema.
- Keep examples generic and synthetic.
- Do not contribute client, patient, family, account, or proprietary data.
- Separate source assertions from AI interpretation.
- Mark maturity honestly: stable standard, open protocol, community standard,
  emerging convention, experimental, local pattern, or pattern only.
- Keep mutating examples behind approval gates.
- Avoid vendor-specific lock-in unless the file is explicitly an adapter.

## Schema Changes

Schema contributions should include:

- the problem the schema solves;
- why existing standards are insufficient;
- examples that validate against the schema;
- side-effect and approval considerations;
- provenance and rights handling if source data is involved.

## Crosswalk Changes

Crosswalks must be explicit. Each mapping should state:

- source path;
- target path;
- transformation;
- whether the mapping is lossy;
- whether human review is required.

## Style

- Use plain Markdown and JSON.
- Keep files small enough for agents and humans to inspect quickly.
- Use ASCII unless a standard name or example requires otherwise.
