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
- Markdown local links resolve.
- Public metadata markers are present in root docs.
- Text files are ASCII-only, use LF line endings, avoid trailing whitespace, and
  end with a newline.
- Simple secret-pattern scans pass.
- The GitHub Actions validation workflow exists and calls `npm run validate`.

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
small project-control validator for the spec itself. If the repo later adds a
reference implementation or CLI package, a future PR can add AJV or another
standards-complete validator behind an explicit dependency decision.
