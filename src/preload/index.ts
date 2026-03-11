import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
	verifyEnvironment: () => ipcRenderer.invoke("verify-environment"),
	getWorkspaceDir: () => ipcRenderer.invoke("get-workspace-dir"),
	setWorkspaceDir: () => ipcRenderer.invoke("set-workspace-dir"),
	readFile: (filename: string) => ipcRenderer.invoke("read-file", filename),
	writeFile: (filename: string, content: string) => ipcRenderer.invoke("write-file", filename, content),
	readAsset: (filename: string) => ipcRenderer.invoke("read-asset", filename),
	formatCode: (filename: string, content: string) => ipcRenderer.invoke("format-code", filename, content),
	startServer: (partId: number, type: "react" | "hono") => ipcRenderer.invoke("start-server", partId, type),
	stopServer: (type: "react" | "hono") => ipcRenderer.invoke("stop-server", type),
	openTerminal: () => ipcRenderer.invoke("open-terminal"),
	onServerLog: (
		callback: (data: { type: "stdout" | "stderr"; serverType: "react" | "hono"; text: string }) => void,
	) => {
		ipcRenderer.on("server-log", (_event, data) => callback(data));
	},
	offServerLog: () => {
		ipcRenderer.removeAllListeners("server-log");
	},
	onEnvProgress: (callback: (msg: string) => void) => {
		ipcRenderer.on("env-progress", (_event, msg) => callback(msg));
	},
	offEnvProgress: () => {
		ipcRenderer.removeAllListeners("env-progress");
	},
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (define in dts)
	window.electron = electronAPI;
	// @ts-expect-error (define in dts)
	window.api = api;
}
