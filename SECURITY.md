# Security Policy

`pwcli-core` is a specification and documentation project. It still treats AI
interfaces as security-sensitive because prompts, tool definitions, schemas, and
examples shape downstream system behavior.

## Security Model

Implementations should assume:

- user input is untrusted;
- harvested metadata is untrusted;
- uploaded documents are untrusted;
- tool descriptions from remote systems are untrusted unless the server is
  explicitly trusted;
- AI-generated text is interpretive output, not authority.

## Hard Boundaries

AI must not:

- invent executable tools;
- bypass approval gates;
- write to databases without a registered execution path;
- change user permissions;
- execute source text as instructions;
- generate live UI code for runtime injection;
- hide source, rights, or provenance uncertainty.

## Required Controls

State-changing capabilities should include:

- explicit side-effect classification;
- approval requirement metadata;
- audit logging;
- source/provenance references;
- rollback or compensating-action notes where practical.

## Reporting Issues

Report security issues through private repository security reporting if enabled,
or contact the maintainers through the repository owner channel. Do not publish
exploit details before maintainers have had a reasonable chance to respond.
