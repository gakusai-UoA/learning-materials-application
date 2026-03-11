import { exec } from 'node:child_process';
import { ipcMain } from 'electron';
import { globalState } from '../state';

export function setupTerminalHandlers() {
	ipcMain.handle('open-terminal', async () => {
		const dir = globalState.workspaceDir || process.cwd();

		try {
			if (process.platform === 'darwin') {
				exec(`open -a Terminal "${dir}"`);
			} else if (process.platform === 'win32') {
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
}
