import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ipcMain } from "electron";
import { globalState } from "../state";

export function setupFsHandlers() {
	ipcMain.handle("read-file", async (_, filename: string) => {
		try {
			const filePath = path.join(globalState.workspaceDir, filename);
			const content = await fs.readFile(filePath, "utf-8");
			return { success: true, content };
		} catch (e: unknown) {
			const err = e as Error;
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle("write-file", async (_, filename: string, content: string) => {
		try {
			const filePath = path.join(globalState.workspaceDir, filename);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, content, "utf-8");
			return { success: true };
		} catch (e: unknown) {
			const err = e as Error;
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle("read-asset", async (_, filename: string) => {
		try {
			const isPackaged = process.mainModule?.filename.includes("app.asar") || false;
			let assetPath: string;

			if (isPackaged) {
				assetPath = path.join(process.resourcesPath, "assets", filename);
			} else {
				// electron-vite の dev 環境では __dirname は `out/main/ipc` または `out/main`
				// 確実なプロジェクトルートを算出するため __dirname を起点とする
				assetPath = path.join(__dirname, "../../assets", filename);

				// __dirname構造によっては階層が異なる可能性があるため、フォールバックも用意
				try {
					await fs.access(assetPath);
				} catch {
					assetPath = path.join(process.cwd(), "assets", filename);
				}
			}

			const buffer = await fs.readFile(assetPath);
			return {
				success: true,
				data: buffer.toString("base64"),
				path: assetPath,
			};
		} catch (e: unknown) {
			const err = e as Error;
			return { success: false, error: err.message };
		}
	});
}
