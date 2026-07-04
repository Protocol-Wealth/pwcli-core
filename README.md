# pwcli-core

`pwcli-core` is an open-source specification for building intent-driven,
dual-engine applications: a conversational or CLI-style surface for human
intent, backed by deterministic routes, schemas, registered panels, typed tools,
provenance, and explicit approval gates.

The project is intentionally not a chatbot framework. It is a control-plane
blueprint for software that can feel conversational without surrendering runtime
predictability.

## Maintainer

`pwcli-core` is published by Protocol Wealth and initiated by Nick Rygiel,
Managing Partner / CTO and a Certified Financial Planner professional.

- Protocol Wealth GitHub: https://github.com/Protocol-Wealth
- Nick Rygiel GitHub: https://github.com/rivendale

## Related Open Source Projects

These Protocol Wealth and maintainer repositories are companion references and
implementation inspiration. The `pwcli-core` specification remains neutral and
reusable outside Protocol Wealth.

- `nexus-core`: https://github.com/Protocol-Wealth/nexus-core
- `pwos-core`: https://github.com/Protocol-Wealth/pwos-core
- `pwplan-core`: https://github.com/Protocol-Wealth/pwplan-core
- `pw-learnai`: https://github.com/Protocol-Wealth/pw-learnai
- `iocalc-agent-env`: https://github.com/rivendale/iocalc-agent-env

## Core Idea

Human language is lossy. Production systems are not.

`pwcli-core` bridges that gap with a simple architecture:

1. A human asks for something in natural language.
2. The system compiles that request into structured intent telemetry.
3. A registered panel, route, workflow, or tool is selected.
4. Read-only actions run directly when safe.
5. Mutating actions stop at an approval gate.
6. Every result keeps source, rights, provenance, and fallback-route context.

## First Principles

- **Dual engine:** AI routes intent; deterministic infrastructure owns state.
- **Bring your own panel:** AI selects registered UI primitives, never invents
  live UI code.
- **Hard trust boundaries:** AI may propose, classify, parse, and select. It may
  not invent routes, schemas, writes, or permissions.
- **Standards Before Invention:** Prefer existing open standards before custom
  schemas.
- **Assertion separation:** Source metadata and AI interpretation are stored as
  distinct layers.
- **Context packs:** Static Markdown files with YAML frontmatter provide
  agent-loadable operating context without turning prompts into a truth store.

## Standards Maturity

`pwcli-core` classifies references by operational maturity:

- **Stable / formal standards:** OpenAPI, JSON Schema, OAI-PMH, Dublin Core,
  MARC 21, IIIF, W3C PROV-O, RDF, JSON-LD, DCAT, SPDX.
- **Widely adopted vocabularies:** schema.org.
- **Open agent protocols:** Model Context Protocol (MCP), Agent-to-Agent (A2A).
- **Community standards:** RO-Crate.
- **Emerging conventions:** llms.txt, AGENTS.md.
- **Local patterns:** context-pack/.
- **Experimental / watch layer:** WebMCP.

See [docs/standards-map.md](docs/standards-map.md) and [docs/companion-projects.md](docs/companion-projects.md).

## Repository Map

```text
pwcli-core/
|-- SPEC.md
|-- SECURITY.md
|-- CONTRIBUTING.md
|-- AGENTS.md
|-- llms.txt
|-- context-pack/
|-- prompts/
|-- schemas/
|-- crosswalks/
|-- examples/
`-- docs/
```

## Quick Start

Read these files in order:

1. [SPEC.md](SPEC.md) for the full architecture specification.
2. [prompts/architecture-engine.md](prompts/architecture-engine.md) for the
   system prompt.
3. [schemas/intent.schema.json](schemas/intent.schema.json) for the central
   intent payload.
4. [docs/standards-map.md](docs/standards-map.md) for standards selection.
5. [docs/context-packs.md](docs/context-packs.md) for context-pack structure.
6. [docs/validation.md](docs/validation.md) for local and CI validation.
7. [examples/turn-based-game/README.md](examples/turn-based-game/README.md) for a runnable browser demo.
8. [docs/human-ux-guide.md](docs/human-ux-guide.md) for progressive disclosure patterns.

## Validation

Run the dependency-free repository checks locally:

```bash
npm run validate
```

The same command runs in GitHub Actions on pull requests and pushes to `main`
using Node 22 and Node 24.

## Runnable Demo

Open [examples/turn-based-game/index.html](examples/turn-based-game/index.html) in a browser for a no-build demo of command input, intent telemetry, registered primitive hydration, approval, deterministic execution, and return-focus ledger output.

## Example Query

Illustrative synthetic example only; not tax, accounting, investment, or financial advice.

```text
User: Look at my taxes.

Intent:
- domain: tax
- intent: review_tax_position
- confidence: 0.82
- sideEffectLevel: read_only
- approvalRequired: false
- fallbackRoute: /taxes
- candidatePanels: [tax-summary-panel, document-gap-checklist]
```

The conversational surface can hydrate a tax review panel, cite source records,
and return focus to the command stream. If confidence is low, it falls back to a
static route instead of inventing behavior.

## License

Licensed under `MIT-0 OR Apache-2.0`.

You may use the frictionless MIT-0 terms or the Apache 2.0 terms with an
explicit patent grant. See [LICENSE-MIT-0](LICENSE-MIT-0) and
[LICENSE-APACHE-2.0](LICENSE-APACHE-2.0).
