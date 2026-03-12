import { exec } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { BrowserWindow, ipcMain } from "electron";

const execAsync = promisify(exec);

export function setupEnvHandlers() {
	ipcMain.handle("verify-environment", async () => {
		const isWin = os.platform() === "win32";
		const isMac = os.platform() === "darwin";

		// ElectronのメインプロセスではPATHが極端に短いことがあるため、
		// シェルからPATHを取得してマージする（fnm/nvm/volta等のバージョンマネージャ対応）
		if (isMac || process.platform === "linux") {
			try {
				const shell = process.env.SHELL || "/bin/zsh";
				const { stdout } = await execAsync(`${shell} -ilc 'echo $PATH'`);
				const shellPath = stdout.trim();
				if (shellPath) {
					const currentPaths = new Set((process.env.PATH || "").split(path.delimiter));
					for (const p of shellPath.split(path.delimiter)) {
						if (p && !currentPaths.has(p)) {
							currentPaths.add(p);
						}
					}
					process.env.PATH = [...currentPaths].join(path.delimiter);
				}
			} catch {
				// フォールバック: よく使われるパスを手動で追加
				for (const p of ["/usr/local/bin", "/opt/homebrew/bin"]) {
					if (!process.env.PATH?.includes(p)) {
						process.env.PATH = `${process.env.PATH}${path.delimiter}${p}`;
					}
				}
			}
		} else if (isWin) {
			try {
				// PowerShellプロファイルを読み込んでPATHを取得（fnm/nvm-windowsはプロファイルで動的にPATH追加する）
				const { stdout } = await execAsync(
					"powershell -Command \"echo $env:PATH\"",
				);
				const winPath = stdout.trim();
				if (winPath) {
					const currentPaths = new Set((process.env.PATH || "").split(path.delimiter));
					for (const p of winPath.split(";")) {
						if (p && !currentPaths.has(p)) {
							currentPaths.add(p);
						}
					}
					process.env.PATH = [...currentPaths].join(path.delimiter);
				}
			} catch {
				// フォールバック: よくあるnodeのパス
				const fallbacks = [
					path.join(os.homedir(), "AppData", "Roaming", "fnm"),
					path.join(os.homedir(), "AppData", "Roaming", "nvm"),
					path.join(os.homedir(), ".volta", "bin"),
					"C:\\Program Files\\nodejs",
				];
				for (const p of fallbacks) {
					if (!process.env.PATH?.includes(p)) {
						process.env.PATH = `${process.env.PATH}${path.delimiter}${p}`;
					}
				}
			}
		}

		// Antigravity パスの追加
		{
			const agyPath = isWin
				? path.join(os.homedir(), "AppData", "Local", "Programs", "Antigravity")
				: path.join(os.homedir(), ".antigravity", "antigravity", "bin");
			if (!process.env.PATH?.includes(agyPath)) {
				process.env.PATH = `${process.env.PATH}${path.delimiter}${agyPath}`;
			}
		}

		const notify = (msg: string) => {
			BrowserWindow.getAllWindows().forEach((win) => {
				win.webContents.send("env-progress", msg);
			});
		};

		notify("Gitを確認中...");
		// Git の確認・インストール
		try {
			await execAsync("git --version");
		} catch {
			try {
				if (isWin) {
					notify("Gitのインストールが必要です。");
					await execAsync(
						"winget install Git.Git --silent --accept-package-agreements --accept-source-agreements",
					);
				} else if (isMac) {
					notify("Git(Command Line Tools)のインストールプロンプトを表示しました。");
					await execAsync("xcode-select --install").catch(() => {});
				}
			} catch (e) {
				console.error("Git install error:", e);
			}
		}

		notify("Node.jsを確認中...");
		// Node.js の確認・インストール
		try {
			await execAsync("node -v");
		} catch {
			try {
				if (isWin) {
					notify("Node.jsをインストール中...");
					await execAsync(
						"winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements",
					);
				} else if (isMac) {
					notify("Node.jsのインストーラーを開きました...");
					const pkgUrl = "https://nodejs.org/dist/v24.10.0/node-v24.10.0.pkg";
					const dest = path.join(os.tmpdir(), "node.pkg");
					await execAsync(`curl -o "${dest}" ${pkgUrl}`);
					await execAsync(`open "${dest}"`);
				}
			} catch (e) {
				console.error("Node install error:", e);
			}
		}

		notify("pnpmを確認中...");
		// pnpm の確認・インストール
		try {
			await execAsync("pnpm --version");
		} catch {
			try {
				notify("npm経由でpnpmをインストールしています...");
				await execAsync("npm install -g pnpm");
			} catch (e) {
				console.error("pnpm install error:", e);
			}
		}

		// ワークスペースフォルダ生成
		notify("ワークスペース構成の準備中...");
		const { globalState } = await import("../state");
		const fs = await import("node:fs/promises");
		try {
			await fs.mkdir(globalState.workspaceDir, { recursive: true });
		} catch {}

		// 全パートのテンプレートを一括展開
		try {
			const { generatePartTemplates } = await import("./template");
			await generatePartTemplates(globalState.workspaceDir, notify);
		} catch (e) {
			console.error("Template generation error:", e);
		}

		// ルートパッケージのインストール
		try {
			await fs.access(path.join(globalState.workspaceDir, "node_modules"));
		} catch {
			notify("ワークスペースの依存関係をインストール中... (初回のみ時間がかかります)");
			const rootPkg = {
				name: "workspace-root",
				type: "module",
				private: true,
				dependencies: {
					react: "^18.2.0",
					"react-dom": "^18.2.0",
					hono: "^4.0.0",
					"drizzle-orm": "^0.38.0",
					"drizzle-zod": "^0.7.0",
					zod: "^3.23.0",
					"@hono/zod-validator": "^0.2.2",
					"@google/genai": "^1.44.0",
				},
				devDependencies: {
					vite: "^5.1.4",
					"@vitejs/plugin-react": "^4.2.1",
					tailwindcss: "^4.0.0",
					"@tailwindcss/vite": "^4.0.0",
					wrangler: "^4.0.0",
					typescript: "^5.2.2",
					"drizzle-kit": "^0.30.0",
					"@types/react": "^18.2.61",
					"@types/react-dom": "^18.2.19",
				},
			};
			await fs.writeFile(path.join(globalState.workspaceDir, "package.json"), JSON.stringify(rootPkg, null, 2));

			await fs.writeFile(
				path.join(globalState.workspaceDir, "pnpm-workspace.yaml"),
				"packages:\n  - 'Part-*/*'\n",
			);

			await new Promise<void>((res) => {
				const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
				import("node:child_process")
					.then(({ spawn }) => {
						const proc = spawn(cmd, ["install"], {
							cwd: globalState.workspaceDir,
							shell: true,
						});
						proc.on("error", (err) => {
							console.error("pnpm install spawn error:", err);
							res(); // エラーでも止まらないように
						});
						proc.on("close", () => res());
					})
					.catch(() => res());
			});
		}

		notify("準備完了！");
		return { success: true };
	});
}
