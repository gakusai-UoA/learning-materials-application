import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SessionType = "all" | "1" | "2";

const PARTS = [
	{ id: 0, title: "Git & GitHub", desc: "チーム開発の基礎とバージョン管理", stack: "Git" },
	{ id: 1, title: "JavaScript の基礎", desc: "Webを動かす言語の基本文法", stack: "JavaScript" },
	{ id: 2, title: "ロジック構築とデータ構造", desc: "関数、配列、アロー関数", stack: "JavaScript" },
	{ id: 3, title: "TypeScript の導入", desc: "型推論、インターフェース、安全な開発", stack: "TypeScript" },
	{ id: 4, title: "はじめてのバックエンド", desc: "Honoを使った基本的なAPI作成", stack: "Hono" },
	{ id: 5, title: "データベースとの連携", desc: "SQLとCloudflare D1への接続", stack: "Hono" },
	{ id: 6, title: "React の基礎", desc: "コンポーネントとJSX、UI構築", stack: "React" },
	{ id: 7, title: "React の状態管理", desc: "useState, useEffect, API通信", stack: "React" },
	{ id: 8, title: "フロントとバックの結合", desc: "API経由でのデータのやり取り", stack: "React ・ Hono" },
	{ id: 9, title: "デプロイ & 発展", desc: "Firebase HostingとWorkersへの公開", stack: "" },
];

export function StartMenu() {
	const navigate = useNavigate();
	const [isPreparing, setIsPreparing] = useState(false);
	const [session, setSession] = useState<SessionType>("all");
	const [stack, setStack] = useState<string>("all");

	const STACK_OPTIONS = [
		{ value: "all", label: "すべての技術 (フィルターなし)" },
		{ value: "git", label: "Git" },
		{ value: "js-ts", label: "JavaScript/TypeScript" },
		{ value: "react", label: "React" },
		{ value: "hono", label: "Hono" },
	];

	const filteredParts = useMemo(() => {
		return PARTS.filter((part) => {
			if (session === "1" && part.id > 4) return false;
			if (session === "2" && part.id < 4) return false;

			if (stack !== "all") {
				const s = part.stack.toLowerCase();
				if (stack === "git" && !s.includes("git")) return false;
				if (stack === "js-ts" && !s.includes("javascript") && !s.includes("typescript")) return false;
				if (stack === "react" && !s.includes("react")) return false;
				if (stack === "hono" && !s.includes("hono")) return false;
			}

			return true;
		});
	}, [session, stack]);

	useEffect(() => {
		setIsPreparing(true);
		window.api
			.verifyEnvironment()
			.then(() => setIsPreparing(false))
			.catch((e) => {
				console.error("Environment check failed", e);
				setIsPreparing(false);
			});
	}, []);

	return (
		<div className="relative flex min-h-screen flex-col bg-background p-8 text-foreground">
			{isPreparing && (
				<div className="fixed right-6 bottom-6 z-50 animate-pulse rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm shadow-xl">
					依存環境(Node/Git)を確認・準備中...
				</div>
			)}
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col pt-12">
				<h1 className="mb-2 font-bold text-4xl">現代的Web開発・基礎勉強会</h1>
				<p className="mb-8 text-muted-foreground">
					JavaScript, TypeScript, React, Hono
					を使ってフロントエンドからバックエンドまでアプリを一通り作れるようになるための体験型学習アプリです。
				</p>

				{/* フィルター・セッション選択領域 */}
				<div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
					<div className="flex w-full gap-1.5 overflow-x-auto rounded-lg bg-muted p-1.5 sm:w-auto">
						<button
							onClick={() => setSession("all")}
							className={cn(
								"whitespace-nowrap rounded-md px-4 py-1.5 font-medium text-sm transition-all",
								session === "all"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							すべて
						</button>
						<button
							onClick={() => setSession("1")}
							className={cn(
								"whitespace-nowrap rounded-md px-4 py-1.5 font-medium text-sm transition-all",
								session === "1"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							第1回 (Part 0-4)
						</button>
						<button
							onClick={() => setSession("2")}
							className={cn(
								"whitespace-nowrap rounded-md px-4 py-1.5 font-medium text-sm transition-all",
								session === "2"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							第2回 (Part 4-9)
						</button>
					</div>

					<div className="flex w-full items-center gap-3 sm:w-auto">
						<label className="hidden whitespace-nowrap font-semibold text-muted-foreground text-sm sm:block">
							技術スタック:
						</label>
						<select
							value={stack}
							onChange={(e) => setStack(e.target.value)}
							className="w-full min-w-[200px] rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
						>
							{STACK_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{filteredParts.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-12 text-muted-foreground">
						該当するパートが見つかりません。
						<Button
							variant="link"
							onClick={() => {
								setSession("all");
								setStack("all");
							}}
						>
							リセット
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredParts.map((part) => (
							<button
								type="button"
								key={part.id}
								className="group flex cursor-pointer flex-col gap-4 rounded-xl border bg-card/50 p-6 text-left shadow-sm transition-colors hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => navigate(`/part/${part.id}`)}
							>
								<div>
									{part.stack ? (
										<span className="mb-3 inline-block rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary text-xs">
											{part.stack}
										</span>
									) : (
										/* 空白 */
										<span className="mb-3 inline-block rounded-md bg-transparent px-2 py-1 font-semibold text-xs"></span>
									)}
									<h2 className="mb-1 font-bold text-xl">Part {part.id}</h2>
									<h3 className="font-semibold text-base text-foreground/80">{part.title}</h3>
								</div>
								<p className="flex-1 text-muted-foreground text-sm">{part.desc}</p>
								<Button className="mt-2 w-full group-hover:bg-primary/90">学習をはじめる</Button>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
