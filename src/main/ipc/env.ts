import { exec } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { ipcMain } from 'electron';

const execAsync = promisify(exec);

export function setupEnvHandlers() {
	ipcMain.handle('verify-environment', async () => {
		const isWin = os.platform() === 'win32';

		// Git の確認・インストール
		try {
			await execAsync('git --version');
		} catch {
			try {
				if (isWin) {
					await execAsync(
						'winget install Git.Git --silent --accept-package-agreements --accept-source-agreements',
					);
				} else {
					exec('git --version'); // macOS の Command Line Tools プロンプトを表示
				}
			} catch (e) {
				console.error('Git install error:', e);
			}
		}

		// Node.js の確認・インストール
		try {
			await execAsync('node -v');
		} catch {
			try {
				if (isWin) {
					await execAsync(
						'winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements',
					);
				} else {
					const pkgUrl = 'https://nodejs.org/dist/v20.11.1/node-v20.11.1.pkg';
					const dest = path.join(os.tmpdir(), 'node.pkg');
					await execAsync(`curl -o "${dest}" ${pkgUrl}`);
					await execAsync(`open "${dest}"`);
				}
			} catch (e) {
				console.error('Node install error:', e);
			}
		}

		// pnpm の確認・インストール
		try {
			await execAsync('pnpm --version');
		} catch {
			try {
				await execAsync('npm install -g pnpm');
			} catch (e) {
				console.error('pnpm install error:', e);
			}
		}

		return { success: true };
	});
}
