# Provenance

`pwcli-core` uses W3C PROV-O concepts as the mental model for provenance.

## Core Concepts

- Entity: the thing produced or described.
- Activity: the process that generated, transformed, or harvested it.
- Agent: the person, organization, service, or model responsible for the
  activity.

## Minimum Trail

Every derived artifact should answer:

- What source records were used?
- Who or what generated the artifact?
- When was it generated?
- Was it transformed?
- What tool, model, or workflow performed the transformation?
- What confidence and review state applies?
