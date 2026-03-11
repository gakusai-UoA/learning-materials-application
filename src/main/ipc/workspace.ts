import * as fs from "node:fs/promises";
import { dialog, ipcMain } from "electron";
import { globalState } from "../state";

export function setupWorkspaceHandlers() {
	ipcMain.handle("get-workspace-dir", async () => {
		try {
			await fs.mkdir(globalState.workspaceDir, { recursive: true });
			return globalState.workspaceDir;
		} catch {
			return globalState.workspaceDir;
		}
	});

	ipcMain.handle("set-workspace-dir", async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
		});
		if (!canceled && filePaths.length > 0) {
			globalState.workspaceDir = filePaths[0];
			return globalState.workspaceDir;
		}
		return null;
	});
}
