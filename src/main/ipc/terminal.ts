import { exec } from "node:child_process";
import { ipcMain } from "electron";
import { globalState } from "../state";

export function setupTerminalHandlers() {
	ipcMain.handle("open-terminal", async () => {
		const dir = globalState.workspaceDir || process.cwd();

		try {
			if (process.platform === "darwin") {
				exec(`open -a Terminal "${dir}"`);
			} else if (process.platform === "win32") {
				exec(`start cmd /K "cd /d ${dir}"`);
			} else {
				exec(`x-terminal-emulator --working-directory="${dir}"`);
			}
			return { success: true };
		} catch (e: unknown) {
			const err = e as Error;
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle("open-editor", async (_, partId: number) => {
		const dir = globalState.workspaceDir
			? require("node:path").join(globalState.workspaceDir, `Part-${partId}`)
			: process.cwd();

		try {
			// agy（Antigravity）で起動を試みる
			const agyCmd = process.platform === "win32" ? "Antigravity.cmd" : "agy";
			await new Promise<void>((resolve, reject) => {
				exec(`${agyCmd} "${dir}"`, (error) => {
					if (error) {
						// 失敗した場合は code (VSCode) で再試行
						exec(`code "${dir}"`, (err2) => {
							if (err2) reject(err2);
							else resolve();
						});
					} else {
						resolve();
					}
				});
			});
			return { success: true };
		} catch (e: unknown) {
			const err = e as Error;
			return { success: false, error: err.message };
		}
	});
}
