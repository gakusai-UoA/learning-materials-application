import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BrowserWindow, ipcMain } from "electron";
import { globalState } from "../state";

export function setupServerHandlers() {
	ipcMain.handle("start-server", async (_, partId: number, type: "react" | "hono") => {
		const processKey = type === "react" ? "activeReactProcess" : "activeHonoProcess";

		if (globalState[processKey]) {
			globalState[processKey].kill();
			globalState[processKey] = null;
		}

		try {
			await fs.mkdir(globalState.workspaceDir, { recursive: true });
		} catch {}

		// typeごとにディレクトリを分ける（例: react / hono）
		const subDir = type === "react" ? "react" : "hono";
		const projectPath = path.join(globalState.workspaceDir, `Part-${partId}`, subDir);

		try {
			// ディレクトリがない場合は作成し、初期ファイル群を展開
			await fs.access(projectPath);
		} catch {
			await fs.mkdir(projectPath, { recursive: true });
			if (type === "react") {
				// React用の最小限のテンプレートを配置
				await fs.mkdir(path.join(projectPath, "src"), { recursive: true });
				await fs.writeFile(
					path.join(projectPath, "package.json"),
					JSON.stringify({ name: `part${partId}-react`, scripts: { dev: "vite" } }, null, 2),
				);
				await fs.writeFile(
					path.join(projectPath, "index.html"),
					'<!DOCTYPE html>\n<html lang="ja">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>React App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>',
				);
				await fs.writeFile(
					path.join(projectPath, "src", "main.tsx"),
					'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App.tsx";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);',
				);
				await fs.writeFile(
					path.join(projectPath, "src", "App.tsx"),
					"export default function App() {\n  return <h1>Hello React!</h1>;\n}",
				);
			} else {
				// Hono用の最小限のテンプレートを配置
				await fs.mkdir(path.join(projectPath, "src"), { recursive: true });
				await fs.writeFile(
					path.join(projectPath, "package.json"),
					JSON.stringify(
						{
							name: `part${partId}-hono`,
							scripts: { dev: "wrangler dev src/index.ts" },
						},
						null,
						2,
					),
				);
				await fs.writeFile(
					path.join(projectPath, "src", "index.ts"),
					'import { Hono } from "hono";\n\nconst app = new Hono();\n\napp.get("/", (c) => c.text("Hello Hono!"));\n\nexport default app;',
				);
			}
		}

		// ルートに共通のpackage.jsonがあるか確認し、なければ作成・インストール
		try {
			await fs.access(path.join(globalState.workspaceDir, "package.json"));
		} catch {
			const rootPkg = {
				name: "workspace-root",
				private: true,
				dependencies: {
					react: "^18.2.0",
					"react-dom": "^18.2.0",
					hono: "^4.0.0",
				},
				devDependencies: {
					vite: "^5.1.4",
					"@vitejs/plugin-react": "^4.2.1",
					wrangler: "^3.0.0",
					typescript: "^5.2.2",
					"@types/react": "^18.2.61",
					"@types/react-dom": "^18.2.19",
				},
			};
			await fs.writeFile(path.join(globalState.workspaceDir, "package.json"), JSON.stringify(rootPkg, null, 2));

			// インストール実行
			console.log("Installing root dependencies...");
			await new Promise<void>((res) => {
				const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
				const installer = spawn(cmd, ["install"], {
					cwd: globalState.workspaceDir,
					shell: true,
				});
				installer.on("close", res);
			});
		}

		return new Promise((resolve) => {
			const scriptName = partId === 9 ? "deploy" : "dev";
			const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
			const args = ["run", scriptName];

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
			globalState[processKey].kill();
			globalState[processKey] = null;
		}
		return { success: true };
	});
}
