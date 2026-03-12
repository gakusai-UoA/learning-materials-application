import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, net, protocol, shell } from "electron";
import icon from "../../resources/icon.png?asset";
import { setupIpcHandlers } from "./ipc";
import { globalState } from "./state";

let isWindowCreated = false;

function safeCreateWindow() {
	if (!isWindowCreated) {
		isWindowCreated = true;
		createWindow();
	}
}

protocol.registerSchemesAsPrivileged([
	{
		scheme: "asset",
		privileges: {
			secure: true,
			standard: true,
			supportFetchAPI: true,
			bypassCSP: true,
			corsEnabled: true,
		},
	},
]);

function createWindow(): void {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
			devTools: false,
		},
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// iframe内（プレビュー・ブラウザサイド）の console.log などを拾う
	mainWindow.webContents.on("console-message", (_event, level, message, _line, sourceId) => {
		// localhost:xxx へのアクセス（ただしElectronのRendererである5174を除く）をプレビューアプリからのログと判定
		if (sourceId?.includes("http://localhost:") && !sourceId.includes("localhost:5174")) {
			// level: 0=debug, 1=info, 2=warning, 3=error
			const type = level >= 2 ? "stderr" : "stdout";
			const serverType = sourceId.includes("8787") ? "hono" : "react";
			mainWindow.webContents.send("server-log", {
				type,
				serverType,
				text: `[Browser] ${message}`,
			});
		}
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

	// カスタムプロトコル asset:// の処理
	protocol.handle("asset", (request) => {
		const urlObj = new URL(request.url);
		// URLのパス部分 (例: /Part-0.pdf) から先頭のスラッシュを取り除くことで、大文字小文字の自動変換によるエラーを防ぐ
		const filename = decodeURIComponent(urlObj.pathname.replace(/^\//, ""));
		const isPackaged = app.isPackaged;
		let assetPath: string;
		if (isPackaged) {
			assetPath = join(process.resourcesPath, "assets", filename);
		} else {
			assetPath = join(__dirname, "../../assets", filename);
		}
		return net.fetch(pathToFileURL(assetPath).toString());
	});

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	// IPC test
	ipcMain.on("ping", () => console.log("pong"));

	// Initialize Custom Handlers
	setupIpcHandlers();

	safeCreateWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) safeCreateWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	killAllServers();
	app.quit();
});

// アプリ終了時に裏側で走っているVite/Wrangler等のサーバープロセスを確実に止める
const killAllServers = () => {
	const { execSync } = require("node:child_process");
	const pids = [globalState.activeReactProcess?.pid, globalState.activeHonoProcess?.pid].filter(Boolean);

	for (const pid of pids) {
		try {
			if (process.platform === "win32") {
				execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
			} else {
				// 子プロセスも含めてSIGKILLで強制終了
				execSync(`pkill -9 -P ${pid}`, { stdio: "ignore" });
				process.kill(pid as number, "SIGKILL");
			}
		} catch {}
	}
	globalState.activeReactProcess = null;
	globalState.activeHonoProcess = null;
};

app.on("before-quit", killAllServers);
app.on("will-quit", killAllServers);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
