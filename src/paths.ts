import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const fromRoot = (...parts: string[]): string => resolve(packageRoot, ...parts);
export const relativeToRoot = (file: string): string => relative(packageRoot, file).split(sep).join("/");
export const resolveProfilePath = (file: string): string => resolve(file);
