import Editor from "@monaco-editor/react";
import { Globe, Terminal as TerminalIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";

interface WorkspacePaneProps {
	partId: number;
}

// 初期コードモック
const REACT_MOCK = `// React (Frontend) Entry Point
console.log("React app initialized");
`;
const HONO_MOCK = `// Hono (Backend) Entry Point
import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

export default app
`;

export function WorkspacePane({ partId }: WorkspacePaneProps) {
	// Active Toggles
	const [activeEnv, setActiveEnv] = useState<"react" | "hono">("react");
	const [activeView, setActiveView] = useState<"editor" | "preview">("editor");

	// Code state
	const [reactCode, setReactCode] = useState(REACT_MOCK);
	const [honoCode, setHonoCode] = useState(HONO_MOCK);

	// Server state
	const [reactRunning, setReactRunning] = useState(false);
	const [honoRunning, setHonoRunning] = useState(false);
	const [reactPort, setReactPort] = useState<number>(5173);
	const [honoPort, setHonoPort] = useState<number>(8787);

	// URL paths
	const [honoUrlPath, setHonoUrlPath] = useState("/");
	const [honoInputUrl, setHonoInputUrl] = useState("/");

	// Logs state
	const [honoServerLogs, setHonoServerLogs] = useState<{ type: "stdout" | "stderr"; text: string }[]>([]);
	const [reactBrowserLogs, setReactBrowserLogs] = useState<{ type: "stdout" | "stderr"; text: string }[]>([]);
	const [honoBrowserLogs, setHonoBrowserLogs] = useState<{ type: "stdout" | "stderr"; text: string }[]>([]);

	// Refs
	const serverLogEndRef = useRef<HTMLDivElement>(null);
	const reactBrowserLogEndRef = useRef<HTMLDivElement>(null);
	const honoBrowserLogEndRef = useRef<HTMLDivElement>(null);

	// スクロール処理
	useEffect(() => {
		serverLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [honoServerLogs]);
	useEffect(() => {
		reactBrowserLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [reactBrowserLogs]);
	useEffect(() => {
		honoBrowserLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [honoBrowserLogs]);

	// 初期化
	useEffect(() => {
		window.api.getWorkspaceDir().then(() => {
			loadFiles();
		});

		window.api.onServerLog((log) => {
			if (log.text.startsWith("[Browser]")) {
				if (log.serverType === "react") {
					setReactBrowserLogs((prev) => [
						...prev,
						{ type: log.type, text: log.text.replace("[Browser] ", "") },
					]);
				} else {
					setHonoBrowserLogs((prev) => [
						...prev,
						{ type: log.type, text: log.text.replace("[Browser] ", "") },
					]);
				}
			} else {
				if (log.serverType === "hono") {
					setHonoServerLogs((prev) => [...prev, { type: log.type, text: log.text }]);
				}
			}
		});

		return () => {
			window.api.offServerLog();
			if (reactRunning) window.api.stopServer("react");
			if (honoRunning) window.api.stopServer("hono");
		};
	}, [partId]);

	// タブ切り替え時の自動起動・停止
	useEffect(() => {
		if (activeEnv === "react" && !reactRunning) {
			startServer("react");
		} else if (activeEnv === "hono" && !honoRunning) {
			startServer("hono");
		}
	}, [activeEnv, partId]);

	const loadFiles = async () => {
		// ユーザー要望のディレクトリ構成 (partX/react, partX/hono)
		const reactFile = `Part-${partId}/react/App.tsx`;
		const honoFile = `Part-${partId}/hono/index.ts`;

		const reactRes = await window.api.readFile(reactFile);
		if (reactRes.success && reactRes.content) setReactCode(reactRes.content);

		const honoRes = await window.api.readFile(honoFile);
		if (honoRes.success && honoRes.content) setHonoCode(honoRes.content);
	};

	const saveFile = async (type: "react" | "hono", currentCode: string) => {
		const filename = type === "react" ? `Part-${partId}/react/App.tsx` : `Part-${partId}/hono/index.ts`;

		const formatRes = await window.api.formatCode(filename, currentCode);
		let finalCode = currentCode;
		if (formatRes.success && formatRes.formatted) {
			finalCode = formatRes.formatted;
			if (type === "react" && finalCode !== currentCode) setReactCode(finalCode);
			if (type === "hono" && finalCode !== currentCode) setHonoCode(finalCode);
		}

		await window.api.writeFile(filename, finalCode);
	};

	const handleEditorChange = (val: string | undefined) => {
		const newCode = val || "";
		if (activeEnv === "react") {
			setReactCode(newCode);
		} else {
			setHonoCode(newCode);
		}
	};

	const switchEnv = async (env: "react" | "hono") => {
		if (activeEnv === env) return;
		// 他の環境へ移る際に、現在エディタが表示されていれば保存
		if (activeView === "editor") {
			await saveFile(activeEnv, activeEnv === "react" ? reactCode : honoCode);
		}
		setActiveEnv(env);
	};

	const switchView = async (view: "editor" | "preview") => {
		if (activeView === view) return;
		// プレビュー等へ移る際に保存
		if (activeView === "editor") {
			await saveFile(activeEnv, activeEnv === "react" ? reactCode : honoCode);
		}
		setActiveView(view);
	};

	const startServer = async (type: "react" | "hono") => {
		const res = await window.api.startServer(partId, type);
		if (res.success) {
			if (type === "react") {
				setReactRunning(true);
				if (res.port) setReactPort(res.port);
				setReactBrowserLogs([
					{ type: "stdout", text: `React開発サーバーをポート ${res.port || 5173} で起動しました` },
				]);
			} else {
				setHonoRunning(true);
				if (res.port) setHonoPort(res.port);
				setHonoServerLogs([
					{ type: "stdout", text: `Hono開発サーバーをポート ${res.port || 8787} で起動しました` },
				]);
			}
		} else {
			if (type === "react") setReactBrowserLogs([{ type: "stderr", text: `起動失敗: ${res.error}` }]);
			if (type === "hono") setHonoServerLogs([{ type: "stderr", text: `起動失敗: ${res.error}` }]);
		}
	};

	const executeHonoNav = (e: React.FormEvent) => {
		e.preventDefault();
		let dest = honoInputUrl;
		if (!dest.startsWith("/")) dest = `/${dest}`;
		setHonoUrlPath(dest);
	};

	// ログ描画ヘルパー
	const renderLogs = (
		logs: { type: "stdout" | "stderr"; text: string }[],
		endRef: React.RefObject<HTMLDivElement | null>,
	) => (
		<div className="flex-1 overflow-y-auto p-3 font-mono text-sm text-zinc-300 leading-relaxed">
			{logs.length === 0 ? (
				<p className="text-zinc-500 italic opacity-50">出力はありません…</p>
			) : (
				logs.map((log, i) => (
					<div key={i} className={`whitespace-pre-wrap ${log.type === "stderr" ? "text-red-400" : ""}`}>
						{log.text}
					</div>
				))
			)}
			<div ref={endRef} />
		</div>
	);

	return (
		<div className="flex h-full flex-col bg-background">
			{/* 最上部：環境トグル */}
			<div className="flex min-h-[3rem] shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2">
				<div className="flex flex-wrap gap-2">
					<button
						className={`flex items-center gap-2 rounded-md px-4 py-1.5 font-bold text-sm transition-colors ${
							activeEnv === "react"
								? "bg-primary text-primary-foreground shadow"
								: "bg-transparent text-muted-foreground hover:bg-muted/50"
						}`}
						onClick={() => switchEnv("react")}
					>
						<Globe className="h-4 w-4" /> React
					</button>
					<button
						className={`flex items-center gap-2 rounded-md px-4 py-1.5 font-bold text-sm transition-colors ${
							activeEnv === "hono"
								? "bg-primary text-primary-foreground shadow"
								: "bg-transparent text-muted-foreground hover:bg-muted/50"
						}`}
						onClick={() => switchEnv("hono")}
					>
						<TerminalIcon className="h-4 w-4" /> Hono
					</button>
				</div>
			</div>

			{/* 2段目：ビュートグル */}
			<div className="flex h-10 shrink-0 items-center border-b bg-muted/10 px-2">
				<button
					className={`h-full cursor-pointer border-b-2 px-4 py-1.5 font-semibold text-sm transition-colors ${
						activeView === "editor"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
					onClick={() => switchView("editor")}
				>
					エディター
				</button>
				<button
					className={`h-full cursor-pointer border-b-2 px-4 py-1.5 font-semibold text-sm transition-colors ${
						activeView === "preview"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
					onClick={() => switchView("preview")}
				>
					プレビュー
				</button>
			</div>

			{/* コンテンツエリア */}
			<div className="relative flex-1 overflow-hidden">
				{/* === EDITOR VIEW === */}
				{activeView === "editor" && (
					<div className="absolute inset-0 flex flex-col bg-zinc-950">
						<ResizablePanelGroup orientation="vertical">
							<ResizablePanel defaultSize={activeEnv === "react" ? 100 : 70} minSize={30}>
								<div className="h-full w-full">
									<Editor
										height="100%"
										defaultLanguage="typescript"
										path={
											activeEnv === "react"
												? `Part-${partId}/react/App.tsx`
												: `Part-${partId}/hono/index.ts`
										}
										theme="vs-dark"
										value={activeEnv === "react" ? reactCode : honoCode}
										onChange={handleEditorChange}
										options={{
											minimap: { enabled: false },
											fontSize: 14,
											wordWrap: "on",
											fixedOverflowWidgets: true,
										}}
									/>
								</div>
							</ResizablePanel>

							{/* HonoのみServer Consoleを表示 */}
							{activeEnv === "hono" && (
								<>
									<ResizableHandle withHandle />
									<ResizablePanel
										defaultSize={30}
										minSize={10}
										className="flex flex-col border-zinc-800 border-t bg-zinc-950"
									>
										<div className="flex h-8 shrink-0 items-center bg-zinc-900 px-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
											<TerminalIcon className="mr-2 h-3 w-3" /> サーバーコンソール (Wrangler)
											<div className="flex-1" />
											<button
												onClick={() => setHonoServerLogs([])}
												className="hover:text-zinc-200"
											>
												クリア
											</button>
										</div>
										{renderLogs(honoServerLogs, serverLogEndRef)}
									</ResizablePanel>
								</>
							)}
						</ResizablePanelGroup>
					</div>
				)}

				{/* === PREVIEW VIEW === */}
				{activeView === "preview" && (
					<div className="absolute inset-0 flex flex-col bg-white">
						<ResizablePanelGroup orientation="vertical">
							{/* 上部：Iframe */}
							<ResizablePanel defaultSize={70} minSize={30}>
								<div className="flex h-full flex-col">
									{/* ReactはURLバー無し、HonoはURLバーあり */}
									{activeEnv === "hono" ? (
										<div className="flex h-10 shrink-0 items-center border-b bg-zinc-100 px-4">
											<div className="mr-2 font-mono text-sm text-zinc-500">
												http://localhost:{honoPort}
											</div>
											<form className="flex-1" onSubmit={executeHonoNav}>
												<input
													className="w-full rounded border px-2 py-1 text-sm outline-none focus:border-primary"
													value={honoInputUrl}
													onChange={(e) => setHonoInputUrl(e.target.value)}
													placeholder="/api/path..."
												/>
											</form>
										</div>
									) : (
										// React
										<div className="flex h-8 w-full items-center border-b bg-zinc-200 px-4">
											<span className="font-mono text-xs text-zinc-500">
												http://localhost:{reactPort}/
											</span>
										</div>
									)}

									<div className="relative flex-1 bg-white">
										{(activeEnv === "react" && reactRunning) ||
										(activeEnv === "hono" && honoRunning) ? (
											<iframe
												key={`${activeEnv}-${activeEnv === "react" ? reactPort : honoPort}-${honoUrlPath}`}
												src={`http://localhost:${activeEnv === "react" ? reactPort : honoPort}${activeEnv === "hono" ? honoUrlPath : ""}`}
												className="absolute inset-0 h-full w-full border-none"
												title="Preview"
											/>
										) : (
											<div className="flex h-full flex-col items-center justify-center text-zinc-400">
												<Globe className="mb-4 h-12 w-12 opacity-20" />
												<p>プレビューが未起動です。</p>
												<p className="mt-1 text-xs">環境: {activeEnv.toUpperCase()}</p>
											</div>
										)}
									</div>
								</div>
							</ResizablePanel>

							{/* 下部：ブラウザコンソール */}
							<ResizableHandle withHandle />
							<ResizablePanel
								defaultSize={30}
								minSize={10}
								className="flex flex-col border-zinc-200 border-t bg-zinc-950"
							>
								<div className="flex h-8 shrink-0 items-center bg-zinc-900 px-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
									<TerminalIcon className="mr-2 h-3 w-3" /> ブラウザコンソール ({activeEnv})
									<div className="flex-1" />
									<button
										onClick={() =>
											activeEnv === "react" ? setReactBrowserLogs([]) : setHonoBrowserLogs([])
										}
										className="hover:text-zinc-200"
									>
										クリア
									</button>
								</div>
								{activeEnv === "react"
									? renderLogs(reactBrowserLogs, reactBrowserLogEndRef)
									: renderLogs(honoBrowserLogs, honoBrowserLogEndRef)}
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				)}
			</div>
		</div>
	);
}
