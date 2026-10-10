import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import type { IMessageTransport } from "@cyanmycelium/mcp-core";
import { webSearchSlot } from "../src/provider.js";

class TestTransport implements IMessageTransport {
    onMessage: ((data: string) => void) | null = null;
    onOpen: (() => void) | null = null;
    onClose: (() => void) | null = null;
    onError: ((error: Error) => void) | null = null;
    isOpen = false;
    private id = 0;
    private pending = new Map<number, (value: any) => void>();
    connect(): void {
        this.isOpen = true;
        queueMicrotask(() => this.onOpen?.());
    }
    close(): void {
        this.isOpen = false;
        this.onClose?.();
    }
    send(data: string): void {
        const message = JSON.parse(data);
        if (message.id !== undefined) {
            this.pending.get(message.id)?.(message);
            this.pending.delete(message.id);
        }
    }
    async rpc(method: string, params: object = {}): Promise<any> {
        const id = ++this.id;
        const response = new Promise((resolve) => this.pending.set(id, resolve));
        this.onMessage?.(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
        return response;
    }
}

describe("autonomous MCP server", () => {
    it("loads both grammars, searches with an injected adapter and bounds the audit", { timeout: 10000 }, async () => {
        const transport = new TestTransport();
        const previous = process.env.BRAVE_SEARCH_API_KEY;
        process.env.BRAVE_SEARCH_API_KEY = "fixture-secret";
        const slot = webSearchSlot("", () => {}, {
            transport,
            fetch: async () => new Response(JSON.stringify({ web: { results: [{ title: "Fixture", url: "https://example.org", description: "Evidence" }] } })),
        });
        try {
            await slot.open();
            assert.deepEqual(slot.grammarKeys, ["default:en", "default:fr"]);
            const initialized = await transport.rpc("initialize", { protocolVersion: "2025-03-26", clientInfo: { name: "test", version: "1" }, capabilities: { locale: "fr" } });
            assert.equal(initialized.result.serverInfo.name, "web");
            const tools = await transport.rpc("tools/list");
            assert.ok(tools.result.tools.some((tool: any) => tool.name === "search" && tool.title === "Chercher sur le web actuel"));
            const description = await transport.rpc("tools/call", { name: "describe", arguments: {} });
            assert.equal(JSON.parse(description.result.content[0].text).result.ready, true);
            for (let i = 0; i < 101; i++) {
                const searched = await transport.rpc("tools/call", { name: "search", arguments: { query: "query " + i } });
                assert.equal(searched.result.isError ?? false, false);
            }
            const resource = await transport.rpc("resources/read", { uri: "web://searches" });
            const audit = JSON.parse(resource.result.contents[0].text);
            assert.equal(audit.length, 100);
            assert.equal(audit[0].query, "query 1");
            assert.ok(!JSON.stringify(resource).includes("fixture-secret"));
            const refused = await transport.rpc("tools/call", { name: "search", arguments: { query: "x", count: 11 } });
            assert.equal(refused.result.isError, true);
            assert.equal(slot.state.searches.length, 100);
        } finally {
            await slot.close();
            if (previous === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
            else process.env.BRAVE_SEARCH_API_KEY = previous;
        }
    });

    it("starts the packaged stdio CLI outside the repository and reports missing credentials", { timeout: 10000 }, async () => {
        const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
        const env: NodeJS.ProcessEnv = { ...process.env, BRAVE_SEARCH_API_KEY: "" };
        delete env.WEB_SEARCH_PROFILE;
        delete env.MCP_WEB_BROKER_URL;
        const child = spawn(process.execPath, [cli], { cwd: tmpdir(), env, stdio: ["pipe", "pipe", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (data) => {
            stderr += data;
        });
        try {
            const response = new Promise<any>((resolve, reject) => {
                let buffer = "";
                child.on("error", reject);
                child.on("exit", (code) => reject(new Error("CLI exited " + code + ": " + stderr)));
                child.stdout.on("data", (data) => {
                    buffer += data;
                    let index: number;
                    while ((index = buffer.indexOf("\n")) >= 0) {
                        const line = buffer.slice(0, index);
                        buffer = buffer.slice(index + 1);
                        try {
                            const message = JSON.parse(line);
                            if (message.id === 2) resolve(message);
                            if (message.id === 1)
                                child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "describe", arguments: {} } }) + "\n");
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            });
            child.stdin.write(
                JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "initialize",
                    params: { protocolVersion: "2025-03-26", clientInfo: { name: "test", version: "1" }, capabilities: {} },
                }) + "\n"
            );
            const message = await response;
            const description = JSON.parse(message.result.content[0].text).result;
            assert.equal(description.ready, false);
            assert.match(description.reason, /BRAVE_SEARCH_API_KEY/);
        } finally {
            child.kill();
        }
    });
});
