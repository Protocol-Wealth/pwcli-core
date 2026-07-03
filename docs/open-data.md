# Open Data

Open data workflows should be harvest-first and rights-aware.

## Preferred Order

1. Use a documented protocol or API.
2. Harvest metadata separately from content.
3. Preserve the raw source record.
4. Normalize into a local schema only after recording source identifiers,
   rights, provenance, and review state.
5. Keep AI interpretation in a separate layer.

## Good Sources

- OAI-PMH for institutional repository metadata.
- IIIF for compound digital object presentation.
- DCAT for dataset catalogs.
- JSON-LD and schema.org for public web structured data.
- RO-Crate for portable research objects.

## Minimum Metadata

- source protocol;
- repository or publisher;
- source identifier;
- retrieval timestamp;
- metadata format;
- rights or license;
- raw record reference;
- provenance record;
- human review state.
