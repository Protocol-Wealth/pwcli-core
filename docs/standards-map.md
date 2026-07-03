# Standards Map

`pwcli-core` uses standards maturity to avoid hype-driven architecture. The goal
is not to adopt every standard, but to know what should be considered before a
custom local schema is invented.

| Reference | Category | Maturity | Use |
| --- | --- | --- | --- |
| OpenAPI | API contracts | stable / formal standard | Describe HTTP APIs and operations. |
| JSON Schema | data contracts | stable / formal standard | Validate structured payloads. |
| OAI-PMH | archive harvesting | stable / formal standard | Harvest repository metadata. |
| Dublin Core | metadata vocabulary | stable / formal standard | Minimal descriptive metadata. |
| MARC 21 | library cataloging | stable / formal standard | Bibliographic target format. |
| IIIF | digital object presentation | stable / formal standard | Present compound visual/media objects. |
| W3C PROV-O | provenance | stable / formal standard | Model entities, activities, agents, derivation. |
| RDF | linked data | stable / formal standard | Graph identity and relationships. |
| JSON-LD | linked data JSON | stable / formal standard | JSON serialization for linked data. |
| DCAT | dataset catalogs | stable / formal standard | Dataset, distribution, service metadata. |
| SPDX | licensing and BOM | stable / formal standard | License expressions and system metadata. |
| schema.org | web vocabulary | widely adopted vocabulary | Public web structured data. |
| MCP | tools and context | open agent protocol | Connect agents to tools and data. |
| A2A | agent delegation | open agent protocol | Agent cards, task lifecycle, artifacts. |
| RO-Crate | research packaging | community standard | Package datasets, workflows, and metadata. |
| llms.txt | agent discoverability | emerging convention | LLM-readable site map and context guide. |
| AGENTS.md | repository instructions | emerging convention | Lightweight instructions for coding agents. |
| context-pack/ | local context graph | pattern only | Versioned Markdown operating context. |
| WebMCP | browser-agent tools | experimental / watch layer | Declarative browser tool exposure. |

## Rule

If a standard covers the domain, reference it. If it does not fit, create a
local schema that still preserves source identifiers, rights, provenance,
confidence, review state, and fallback routes.
