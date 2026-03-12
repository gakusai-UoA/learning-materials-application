import { spawn } from "node:child_process";
import { ipcMain } from "electron";
import { globalState } from "../state";

export function setupFormatHandlers() {
	ipcMain.handle("format-code", async (_, filename: string, content: string) => {
		return new Promise((resolve) => {
			const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
			const args = ["@biomejs/biome", "format", "--stdin-file-path", filename];

			const child = spawn(cmd, args, { cwd: globalState.workspaceDir });
			let stdoutData = "";
			let stderrData = "";

			// biomeが未インストールの場合にnpxがハングするのを防ぐためタイムアウト設定
			const timeout = setTimeout(() => {
				child.kill();
				resolve({ success: false, error: "Format timed out" });
			}, 5000);

			child.stdout.on("data", (data) => (stdoutData += data));
			child.stderr.on("data", (data) => (stderrData += data));

			child.on("close", (code) => {
				clearTimeout(timeout);
				if (code === 0) {
					resolve({ success: true, formatted: stdoutData });
				} else {
					resolve({ success: false, error: stderrData });
				}
			});

			child.on("error", (err) => {
				clearTimeout(timeout);
				resolve({ success: false, error: err.message });
			});

			child.stdin.write(content);
			child.stdin.end();
		});
	});
}
