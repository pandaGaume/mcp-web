[![mcp-broker: slot](docs/assets/mcp-broker-badge.svg)](https://github.com/pandaGaume/mcp-broker)
[![CI](https://github.com/pandaGaume/mcp-web/actions/workflows/ci.yml/badge.svg)](https://github.com/pandaGaume/mcp-web/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

<p align="center">
  <img src="docs/assets/logo.png" alt="mcp-web: a blue pixel panda holding a glowing globe, with a magnifying glass on its chest" width="220">
  <img src="docs/assets/mcp-broker-family.png" alt="MCP Broker Family" width="64" height="64">
</p>

# mcp-web

Provider-neutral web search for MCP clients and [mcp-broker](https://github.com/pandaGaume/mcp-broker). Five adapters share one result contract: ranked results, sources, citations, queries, usage and latency.

Extracted from the web slot of co2-scrubber-governed-agent, with the npm workspace structure of mcp-history. All runtime modules, profiles and grammars live here. No sibling checkout, hardware substrate or original harness is required.

## Run locally

Node.js 22 or newer:

```sh
npm install
npm run build
npm run typecheck
npm test
```

Copy `.env.example` to `.env` and set `BRAVE_SEARCH_API_KEY`. The default profile uses Brave. Without credentials the server still starts and `describe` explains what is missing.

```sh
npm start
# Or publish the web slot on an existing broker:
npm start -- --broker ws://localhost:3000
# Select another profile:
npm start -- --profile packages/mcp-web/profiles/web-search-tavily.json
```

The default transport is line-delimited MCP over stdio. Diagnostics go to stderr. The broker option connects to its multiplex endpoint `/providers`; broker access policy belongs to the broker. Set `BROKER_PROVIDER_SECRET_WEB` when provider authentication is required. `MCP_WEB_BROKER_URL` also selects broker mode.

For an MCP client, point directly at the built CLI:

```json
{
  "mcpServers": {
    "web": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-web/packages/mcp-web/dist/cli.js"],
      "env": { "BRAVE_SEARCH_API_KEY": "your-key" }
    }
  }
}
```

The built-in default profile and grammars resolve relative to the package, even when the client starts it from another directory. Explicit `--profile` and `WEB_SEARCH_PROFILE` paths resolve relative to the working directory. Use an absolute path in client configurations. The CLI reads environment variables; `npm start` additionally loads the repository's `.env`.

## Providers

Profiles are under `packages/mcp-web/profiles/`. Secrets are referenced by environment variable name, never stored in a profile.

| Provider | Profile | Required variables | Mode |
| --- | --- | --- | --- |
| Brave | `web-search.json` | `BRAVE_SEARCH_API_KEY` | Ranked snippets |
| Tavily | `web-search-tavily.json` | `TAVILY_SEARCH_API_KEY` | Ranked snippets |
| Google Custom Search | `web-search-google.json` | `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | Ranked snippets |
| OpenAI Responses | `web-search-openai.json` | `OPENAI_API_KEY` | Cited answer and sources |
| Anthropic Messages | `web-search-anthropic.json` | `ANTHROPIC_API_KEY` | Cited answer and sources |

Hosted profiles carry example model identifiers copied from the source project. Select a model available to your account before use. External provider calls are billable according to your provider account. The tests use fixtures and do not validate account access or current model availability.

## MCP surface

| Surface | Purpose |
| --- | --- |
| `describe` | Provider, model, readiness, limits and profile hash, without an external call |
| `search` | Search query, up to 10 results, optional domain filters and location |
| `web://searches` | Last 100 successful searches, in memory, without API keys |
| `web://grammars` | Loaded grammar keys, file hashes and runtime grammar keys |

Responses preserve the original slot envelope: `{ slot, tool, arguments, result, stub: false, at }`. Refusals are MCP tool errors. The audit clears when the process restarts.

`search` accepts `query` (1 to 600 characters, up to 75 words), `count` (1 to 10), `country`, `language`, `allowed_domains`, `blocked_domains`, and `user_location`. Domain lists accept up to 20 bare domains and cannot be combined. Location and language support varies by provider. Treat all web content as untrusted evidence and retain source URLs.

English and French grammars are bundled. The session locale comes from the client's locale capability, then `SLOT_LOCALE`, then English. The server also registers mcp-core's grammar editing behavior. In broker deployments restrict those operator tools through broker policy.

## Library

The workspace package is `@cyanmycelium/mcp-web`. After publishing or installing a locally packed archive:

```ts
import { searchWeb } from "@cyanmycelium/mcp-web/api";

const result = await searchWeb(
    { provider: "brave-search", apiKey: process.env.BRAVE_SEARCH_API_KEY ?? "" },
    { query: "current web standards", count: 5, allowed_domains: ["w3.org"] }
);
```

The API subpath contains the adapters without importing the MCP server.

```ts
import { webSearchSlot } from "@cyanmycelium/mcp-web";

const slot = webSearchSlot("ws://localhost:3000", console.error, {
    profileFile: "/absolute/path/to/profile.json",
    secret: process.env.BROKER_PROVIDER_SECRET_WEB
});
await slot.open();
// On shutdown:
await slot.close();
```

Pass a `transport` option to use another mcp-core transport, and `fetch` to inject an HTTP implementation. The root export also exposes the result types, profile validation and slot publisher.

## Development and packaging

`npm run format` checks TypeScript formatting. CI installs from the lockfile, checks formatting, builds, typechecks and runs fixture and MCP integration tests. Build before running the tests, which include the packaged CLI.

```sh
npm pack -w @cyanmycelium/mcp-web
```

The archive includes ESM, declarations, source maps, profiles, both grammars and the Apache-2.0 license. See [extraction notes](docs/extraction.md) for provenance and compatibility.

## License

Apache-2.0.

