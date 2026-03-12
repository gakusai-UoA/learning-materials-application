import { spawn } from "node:child_process";
import * as path from "node:path";
import { BrowserWindow, ipcMain } from "electron";
import { globalState } from "../state";

const kill = require("tree-kill");

export function setupServerHandlers() {
	// 起動中の排他制御（Promiseで待機キューを管理）
	const startingLock = new Map<string, Promise<unknown>>();

	ipcMain.handle("start-server", async (_, partId: number, type: "react" | "hono") => {
		// 前回の起動処理が終わるまで待つ
		if (startingLock.has(type)) {
			await startingLock.get(type);
		}

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

		let port = type === "react" ? 5173 : 8787; // デフォルト想定ポート

		const startPromise = new Promise((resolve) => {
			const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

			// コマンド引数の組み立て
			let args: string[] = [];
			if (type === "react") {
				args = ["exec", "vite", "--port", port.toString(), "--strictPort"];
			} else {
				args = ["exec", "wrangler", "dev", "src/index.ts", "--port", port.toString(), "--remote"];
			}

			const child = spawn(cmd, args, { cwd: projectPath, shell: true });
			globalState[processKey] = child;

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

				// Wrangler等が実際には別のポートで立ち上がったケースのフォールバック
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

		// ロックをセットし、完了後にクリア
		startingLock.set(type, startPromise);
		const result = await startPromise;
		startingLock.delete(type);

		return result;
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
