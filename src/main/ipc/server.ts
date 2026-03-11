import { spawn } from "node:child_process";
import * as path from "node:path";
import { BrowserWindow, ipcMain } from "electron";
import { globalState } from "../state";
const kill = require("tree-kill");

export function setupServerHandlers() {
	ipcMain.handle("start-server", async (_, partId: number, type: "react" | "hono") => {
		const processKey = type === "react" ? "activeReactProcess" : "activeHonoProcess";

		if (globalState[processKey]) {
			await new Promise<void>((resolve) => {
				kill(globalState[processKey]!.pid!, "SIGTERM", () => {
					globalState[processKey] = null;
					resolve();
				});
			});
			// ポート解放を待つ
			await new Promise((r) => setTimeout(r, 500));
		}

		// typeごとにディレクトリを分ける（例: react / hono）
		const subDir = type === "react" ? "react" : "hono";
		const projectPath = path.join(globalState.workspaceDir, `Part-${partId}`, subDir);

		return new Promise((resolve) => {
			const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
			// プロジェクトルート（workspaceDir）で親ディレクトリのモジュールを使えるように exec で実行
			const args = type === "react" ? ["exec", "vite"] : ["exec", "wrangler", "dev", "src/index.ts"];

			const child = spawn(cmd, args, { cwd: projectPath, shell: true });
			globalState[processKey] = child;

			let port = type === "react" ? 5173 : 8787; // デフォルト想定ポート

			child.stdout?.on("data", (data) => {
				const text = data.toString();
				console.log(`[${type} stdout]`, text);

				// Rendererに送信
				BrowserWindow.getAllWindows().forEach((win) => {
					win.webContents.send("server-log", {
						type: "stdout",
						serverType: type,
						text,
					});
				});

				const match = text.match(/http:\/\/localhost:(\d+)/);
				if (match?.[1]) {
					port = parseInt(match[1], 10);
				}
			});

			child.stderr?.on("data", (data) => {
				const text = data.toString();
				console.error(`[${type} stderr]`, text);

				// Rendererに送信
				BrowserWindow.getAllWindows().forEach((win) => {
					win.webContents.send("server-log", {
						type: "stderr",
						serverType: type,
						text,
					});
				});
			});

			child.on("spawn", () => {
				setTimeout(() => resolve({ success: true, port }), 1500);
			});

			child.on("error", (e) => {
				resolve({ success: false, error: e.message });
			});
		});
	});

	ipcMain.handle("stop-server", async (_, type: "react" | "hono") => {
		const processKey = type === "react" ? "activeReactProcess" : "activeHonoProcess";
		if (globalState[processKey]) {
			await new Promise<void>((resolve) => {
				kill(globalState[processKey]!.pid!, "SIGTERM", () => {
					globalState[processKey] = null;
					resolve();
				});
			});
			// ポート解放を待つ
			await new Promise((r) => setTimeout(r, 500));
		}
		return { success: true };
	});
}
