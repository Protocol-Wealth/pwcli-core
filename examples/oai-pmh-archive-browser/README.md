# OAI-PMH Archive Browser Example

Synthetic example for an archive browser that harvests public metadata, maps it
through a crosswalk, and renders registered panels.

## Flow

1. Harvest OAI-PMH records.
2. Preserve raw XML and source identifiers.
3. Normalize Dublin Core fields into a local source record.
4. Use a crosswalk for MARC 21 or schema.org output.
5. Hydrate archive record and rights review panels.

No live archive data is included in this repository.
