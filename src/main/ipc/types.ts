import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ipcMain } from "electron";
import { globalState } from "../state";

export function setupTypesHandlers() {
	ipcMain.handle("fetch-types", async (_, packageName: string) => {
		try {
			const baseDir = globalState.workspaceDir || process.cwd();
			const packageDir = path.join(baseDir, "node_modules", packageName);

			const results: { path: string; content: string }[] = [];

			try {
				await fs.access(packageDir);
			} catch {
				return { success: false, error: `Package not found: ${packageName}` };
			}

			async function scanDir(dir: string) {
				const entries = await fs.readdir(dir, { withFileTypes: true });
				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);
					if (entry.isDirectory()) {
						if (entry.name !== "node_modules") {
							// ネストした部分は無視するか再帰するかだが、基本的なATAとしては自分のパッケージ内だけ探す
							await scanDir(fullPath);
						}
					} else if (
						entry.isFile() &&
						(entry.name.endsWith(".d.ts") || entry.name.endsWith(".d.mts") || entry.name === "package.json")
					) {
						const content = await fs.readFile(fullPath, "utf-8");
						const relativePath = path.relative(path.join(baseDir, "node_modules"), fullPath);
						const monacoPath = `file:///node_modules/${relativePath.replace(/\\/g, "/")}`;
						results.push({ path: monacoPath, content });
					}
				}
			}

			await scanDir(packageDir);
			return { success: true, files: results };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : String(error) };
		}
	});
}
