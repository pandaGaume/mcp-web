import { defineConfig } from "tsup";
export default defineConfig({
    entry: { index: "src/index.ts", api: "src/api.ts", cli: "src/cli.ts" },
    format: ["esm"], dts: true, sourcemap: true, clean: true,
    splitting: false, target: "es2022", platform: "node",
    external: ["@cyanmycelium/mcp-core", "@cyanmycelium/mcp-broker-provider"],
});
