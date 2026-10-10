# Extraction and compatibility

The starting implementation was copied from the local co2-scrubber-governed-agent repository:

- `slots/tools/web/api.ts`: five HTTP adapters, validation and result normalization.
- `slots/tools/web/provider.ts`: describe/search tools and bounded search audit.
- `slots/tools/web/grammars/default/{en,fr}.json`: localized wording.
- `profiles/web-search*.json`: provider profiles with environment variable references.
- `slots/lib/slot-server.ts` and `slots/lib/grammars.ts`: MCP publication and grammar resolution.
- `tests/web.test.ts`: provider fixtures and request validation.

mcp-history provided the initial reference and panda family artwork. The final structure follows mcp-uns: one public npm package at the repository root, with sources, tests, build configuration and a tag-driven release workflow.

## Changes

Paths now resolve from this package's ESM module location. Explicit profile paths resolve from the caller's working directory. Small local file helpers replace imports into the harness. No relative import, file dependency or symlink points to another repository.

The publisher accepts an injected mcp-core transport. The CLI uses stdio by default and MultiplexTransport for broker mode. Diagnostics use stderr. Provider authentication reads `BROKER_PROVIDER_SECRET_WEB`, replacing the demo-specific shared secret variable.

The original `web` identity, tool names, resources, response envelope and 100-entry audit bound remain. English and French grammar files travel with the npm package. Runtime grammar edits are local to the server and should be restricted through broker policy when used by operators.

The pure search API is available as a separate export. A custom fetch implementation can be injected into both the pure API and the MCP slot for testing or integration.

Tests cover all five provider fixtures, request refusal, server initialization, localized tools, successful search, audit eviction, missing credentials and the built CLI running outside this repository. No paid provider request is made by the test suite.

## Logo

`docs/assets/logo.png` was generated with the built-in imagegen tool using mcp-history's panda as a style reference.

Prompt: blue and cyan pixel-art panda in the same family, holding a glowing globe, with a magnifying glass on its chest, no lettering, transparent background.
