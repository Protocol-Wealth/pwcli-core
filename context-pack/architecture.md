---
id: architecture
type: architecture_graph
title: pwcli-core Architecture Graph
summary: Lightweight graph of the main architectural nodes and relationships.
status: active
version: 1.0.0
scope: public specification
sensitivity: public
tags:
  - state-machine
  - primitives
  - execution
related:
  - principles
lastReviewed: 2026-07-03
---

# Architecture Graph

```text
Human input
  -> intent.schema.json
  -> primitive.schema.json
  -> route.schema.json fallback
  -> execution.schema.json when tools are needed
  -> provenance.schema.json and rights.schema.json for sources
  -> return-focus artifact
```

Every path has a deterministic fallback route. Every source keeps provenance and
rights metadata. Every mutation passes an approval gate.
