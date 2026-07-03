# Metadata Crosswalks

A crosswalk is an explicit translation between two metadata structures. It is not
a prompt. It is a deterministic mapping that can be reviewed and tested.

## Required Fields

- source schema;
- target schema;
- source path;
- target path;
- transform;
- lossiness;
- human review requirement;
- notes.

## Example

```text
dc:title -> MARC 245$a
transform: copy literal title string
lossiness: low
humanReviewRequired: true
```

## Rules

- Do not hide lossy mappings.
- Do not overwrite source metadata.
- Preserve raw source records.
- Use AI to draft candidate mappings, not to silently normalize records.
