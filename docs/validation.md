# Validation

`pwcli-core` uses a dependency-free validation script to keep the public spec
small, inspectable, and deterministic.

Run locally:

```bash
npm run validate
```

The GitHub Actions workflow runs the same command on pull requests and pushes to
`main` using Node 22 and Node 24.

## What It Checks

- Every `schemas/*.schema.json` file parses as JSON.
- Schema files use JSON Schema Draft 2020-12.
- Schema files include `$schema`, `$id`, `title`, `description`, `type`, and
  `properties`.
- Every schema is referenced by `README.md`, `SPEC.md`, `llms.txt`, or this
  validation doc.
- Every crosswalk in `crosswalks/*.json` has required mapping fields:
  `sourcePath`, `targetPath`, `transform`, `lossiness`, and
  `humanReviewRequired`.
- Every `context-pack/*.md` file has YAML frontmatter matching the repository's
  context-pack convention.
- Example-local `.schema.json` files parse, and fixture JSON files declare a resolvable `schemaRef`, `name`, `summary`, and `example`; core, runtime-adapter, redaction-policy, and run-receipt fixtures receive lightweight shape checks.
- Markdown local links resolve.
- Public metadata markers are present in root docs.
- Text files are ASCII-only, use LF line endings, avoid trailing whitespace, and
  end with a newline.
- Simple secret-pattern scans pass.
- The GitHub Actions validation workflow exists and calls `npm run validate`.
- The Python and TypeScript Claude Agent SDK reference-adapter tests pass with
  injected fake runtimes and no provider call.
- The dependency-aware CI job builds/installs the Python package, constructs
  options against the pinned Python SDK, installs the pinned TypeScript SDK,
  typechecks against its API, and reruns both suites.

## Example Failure

```text
context-pack/principles.md: missing frontmatter key maturity
```

Fix by adding the required frontmatter field:

```yaml
maturity: pattern_only
```

## Design Notes

This is not a replacement for full JSON Schema validation libraries. It is a
small project-control validator for the spec and reference examples. The
Claude Agent SDK packages are isolated in nested example manifests and are not
installed by the root validator. Pull-request CI separately exercises those
pinned dependencies and package boundaries. A production package can add AJV or
another standards-complete validator behind an explicit dependency decision.
