import type { ElectronAPI } from "@electron-toolkit/preload";

declare global {
	interface Window {
		electron: ElectronAPI;
		api: {
			verifyEnvironment: () => Promise<{ success: boolean; error?: string }>;
			getWorkspaceDir: () => Promise<string | null>;
			setWorkspaceDir: () => Promise<string | null>;
			readFile: (filename: string) => Promise<{ success: boolean; content?: string; error?: string }>;
			writeFile: (filename: string, content: string) => Promise<{ success: boolean; error?: string }>;
			readAsset: (filename: string) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
			formatCode: (
				filename: string,
				content: string,
			) => Promise<{ success: boolean; formatted?: string; error?: string }>;
			startServer: (
				partId: number,
				type: "react" | "hono",
			) => Promise<{ success: boolean; port?: number; error?: string }>;
			stopServer: (type: "react" | "hono") => Promise<{ success: boolean; error?: string }>;
			openTerminal: () => Promise<{ success: boolean; error?: string }>;
			openEditor: (partId: number) => Promise<{ success: boolean; error?: string }>;
			onServerLog: (
				callback: (data: { type: "stdout" | "stderr"; serverType: "react" | "hono"; text: string }) => void,
			) => void;
			offServerLog: () => void;
			onEnvProgress: (callback: (msg: string) => void) => void;
			offEnvProgress: () => void;
		};
	}
}
