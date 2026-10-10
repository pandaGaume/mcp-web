# @cyanmycelium/mcp-web

Five web search adapters with one result contract, a standalone MCP stdio server and a slot for mcp-broker.

See the [repository documentation](https://github.com/pandaGaume/mcp-web) for configuration and examples.

The command `mcp-web` defaults to stdio. `mcp-web --broker ws://localhost:3000` publishes the web slot on an existing broker. `--profile /path/to/profile.json` selects a provider profile. The bundled default uses Brave and reads `BRAVE_SEARCH_API_KEY`.

Import `searchWeb` from `@cyanmycelium/mcp-web/api` to call an adapter directly, or `webSearchSlot` from `@cyanmycelium/mcp-web` to embed the MCP server.

Node.js 22 or newer. Apache-2.0.
