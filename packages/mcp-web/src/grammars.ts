import type { GrammarResolverOptions, McpClientCapabilities, McpClientInfo } from "@cyanmycelium/mcp-core";

export const AGENT_FAMILIES: Record<string, readonly string[]> = {
    nemotron: ["nemotron", "nvidia"],
    gpt: ["gpt", "openai"],
    claude: ["claude", "anthropic"],
    gemini: ["gemini", "google"],
    mistral: ["mistral"],
};
export const DEFAULT_AGENT = "default";
export const DEFAULT_LOCALE = "en";
export const BASELINE_KEY = `${DEFAULT_AGENT}:${DEFAULT_LOCALE}`;

/** The locale a client asked for: `capabilities.locale`, then the process, then English. */
export function localeOf(_clientInfo: McpClientInfo, capabilities?: McpClientCapabilities): string {
    const asked = (capabilities as { locale?: unknown } | undefined)?.locale;
    if (typeof asked === "string" && asked.trim()) return asked.trim();
    return process.env.SLOT_LOCALE?.trim() || DEFAULT_LOCALE;
}

/** The declarative resolver every slot uses: the same chain for the same client, on every slot. */
export function resolverOptions(): GrammarResolverOptions {
    return { agents: AGENT_FAMILIES, localeSource: localeOf, fallbackKey: BASELINE_KEY };
}

/** The locale of a resolver key (`claude:fr-ca` -> `fr-ca`). */
export const localeOfKey = (key: string): string | undefined => key.split(":")[1];
