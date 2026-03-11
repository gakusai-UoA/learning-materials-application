import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrowserWindow, ipcMain } from 'electron';
import { globalState } from '../state';

export function setupServerHandlers() {
	ipcMain.handle('start-server', async (_, partId: number, type: 'react' | 'hono') => {
		const processKey = type === 'react' ? 'activeReactProcess' : 'activeHonoProcess';

		if (globalState[processKey]) {
			globalState[processKey].kill();
			globalState[processKey] = null;
		}

		try {
			await fs.mkdir(globalState.workspaceDir, { recursive: true });
		} catch {}

		// typeごとにディレクトリを分ける（例: frontend / backend）
		// ディレクトリ構造はユーザーの環境に依存するが、標準的なモノレポ構成を想定
		const subDir = type === 'react' ? 'frontend' : 'backend';
		let projectPath = path.join(globalState.workspaceDir, `Part-${partId}`, subDir);

		// もしサブディレクトリが存在しない場合は、フォールバックとしてPart自体をルートにする
		try {
			await fs.access(projectPath);
		} catch {
			projectPath = path.join(globalState.workspaceDir, `Part-${partId}`);
		}

		return new Promise((resolve) => {
			const scriptName = partId === 9 ? 'deploy' : 'dev';
			const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
			const args = ['run', scriptName];

			const child = spawn(cmd, args, { cwd: projectPath, shell: true });
			globalState[processKey] = child;

			let port = type === 'react' ? 5173 : 8787; // デフォルト想定ポート

			child.stdout?.on('data', (data) => {
				const text = data.toString();
				console.log(`[${type} stdout]`, text);

				// Rendererに送信
				BrowserWindow.getAllWindows().forEach((win) => {
					win.webContents.send('server-log', {
						type: 'stdout',
						serverType: type,
						text,
					});
				});

				const match = text.match(/http:\/\/localhost:(\d+)/);
				if (match?.[1]) {
					port = parseInt(match[1], 10);
				}
			});

			child.stderr?.on('data', (data) => {
				const text = data.toString();
				console.error(`[${type} stderr]`, text);

				// Rendererに送信
				BrowserWindow.getAllWindows().forEach((win) => {
					win.webContents.send('server-log', {
						type: 'stderr',
						serverType: type,
						text,
					});
				});
			});

			child.on('spawn', () => {
				setTimeout(() => resolve({ success: true, port }), 1500);
			});

			child.on('error', (e) => {
				resolve({ success: false, error: e.message });
			});
		});
	});

	ipcMain.handle('stop-server', async (_, type: 'react' | 'hono') => {
		const processKey = type === 'react' ? 'activeReactProcess' : 'activeHonoProcess';
		if (globalState[processKey]) {
			globalState[processKey].kill();
			globalState[processKey] = null;
		}
		return { success: true };
	});
}
