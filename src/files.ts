import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
export const sha256File = (file: string): string => createHash("sha256").update(readFileSync(file)).digest("hex");
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
