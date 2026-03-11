import { ChevronLeft, ChevronRight, Home, Sidebar, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SlideViewer } from '@/components/SlideViewer';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { WorkspacePane } from '@/components/WorkspacePane';

export function LearningView() {
	const { id } = useParams();
	const partId = Number(id);
	const navigate = useNavigate();

	// Gitなど純粋な座学のみのパートはデフォルトでエディタ画面を開かない
	const defaultHasWorkspace = partId !== 0;
	const [showWorkspace, setShowWorkspace] = useState(defaultHasWorkspace);

	// partIdが変わったらデフォルト表示に戻す
	useEffect(() => {
		setShowWorkspace(partId !== 0 && partId !== 9);
	}, [partId]);
	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
			{/* 簡易ヘッダー・ナビゲーション */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon" onClick={() => navigate('/')}>
						<Home className="h-4 w-4" />
					</Button>
					<span className="font-semibold text-sm">Part {partId}を開いています</span>
				</div>

				<div className="flex items-center gap-2">
					{/* ターミナル起動＆表示切替ボタン群 */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.api.openTerminal()}
						title="OS標準のターミナルを開く"
					>
						<Terminal className="mr-1 h-4 w-4" />
						ターミナルを開く
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowWorkspace(!showWorkspace)}
						title="エディタ領域の表示切替"
					>
						<Sidebar className="mr-1 h-4 w-4" />
						{showWorkspace ? 'エディタを隠す' : 'エディタを表示'}
					</Button>

					{/* 前後ナビゲーション */}
					<Button
						variant="outline"
						size="sm"
						disabled={partId <= 0}
						onClick={() => navigate(`/part/${partId - 1}`)}
					>
						<ChevronLeft className="mr-1 h-4 w-4" />
						前のパート
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={partId >= 9}
						onClick={() => navigate(`/part/${partId + 1}`)}
					>
						次のパート
						<ChevronRight className="ml-1 h-4 w-4" />
					</Button>
				</div>
			</header>

			{/* メインレイアウト（スプリットビューまたは全画面表示） */}
			<main className="flex-1 overflow-hidden">
				{showWorkspace ? (
					<ResizablePanelGroup orientation="horizontal">
						{/* 左ペイン: スライドビューア */}
						<ResizablePanel defaultSize={50} minSize={30}>
							<SlideViewer partId={partId} />
						</ResizablePanel>

						<ResizableHandle withHandle />

						{/* 右ペイン: ワークスペース（Mocano/Browser） */}
						<ResizablePanel defaultSize={50} minSize={30}>
							<WorkspacePane partId={partId} />
						</ResizablePanel>
					</ResizablePanelGroup>
				) : (
					<div className="h-full w-full">
						<SlideViewer partId={partId} />
					</div>
				)}
			</main>
		</div>
	);
}
