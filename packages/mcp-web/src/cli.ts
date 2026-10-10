#!/usr/bin/env node
import { StdioTransport } from "@cyanmycelium/mcp-core/node";
import { webSearchSlot } from "./provider.js";

const args = process.argv.slice(2);
if (args.includes("--help")) {
    console.log("mcp-web [--broker ws://localhost:3000] [--profile path.json]\nDefaults to MCP over stdio. Secrets are read from the profile's environment variables.");
} else {
    const value = (flag: string): string | undefined => {
        const index = args.indexOf(flag);
        if (index < 0) return undefined;
        const next = args[index + 1];
        if (!next || next.startsWith("--")) throw new Error(flag + " requires a value");
        return next;
    };
    try {
        for (const arg of args.filter((item) => item.startsWith("--"))) {
            if (!["--broker", "--profile"].includes(arg)) throw new Error("unknown option " + arg);
        }
        const broker = value("--broker") ?? process.env.MCP_WEB_BROKER_URL;
        const slot = webSearchSlot(broker ?? "", console.error, {
            profileFile: value("--profile"),
            ...(!broker ? { transport: new StdioTransport() } : {}),
        });
        for (const signal of ["SIGINT", "SIGTERM"] as const) {
            process.once(signal, () => {
                void slot.close().then(() => process.exit(0));
            });
        }
        await slot.open();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
