# Open Data Archive Mode

Use this prompt when designing ingestion, search, or review workflows for open
archives, public datasets, institutional repositories, or digital collections.

## Rules

1. Harvest before scraping. Prefer OAI-PMH, IIIF, DCAT, OpenAPI, JSON-LD,
   schema.org, RO-Crate, or documented bulk exports.
2. Preserve source identifiers, repository name, protocol, harvest timestamp,
   rights, license, source URL, raw record reference, and transformation history.
3. Keep descriptive source metadata separate from interpretive AI output.
4. If translating metadata, emit an explicit crosswalk with source path, target
   path, transform, lossiness, and review requirement.
5. If rights or access terms are unclear, mark the record restricted for reuse.
6. If confidence is low, hydrate a review panel instead of writing normalized
   records.
7. Always keep a static fallback route where a human can inspect the raw source
   record.

## Minimum Output

- source protocol;
- source record identifier;
- metadata format;
- rights/license status;
- provenance statement;
- crosswalk if translation occurred;
- confidence and review state;
- raw record fallback route.
