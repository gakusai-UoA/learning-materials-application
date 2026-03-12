import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

// Viteのビルドやアセット解決の不具合を確実に回避するため、CDNから直接ワーカーを読む
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SlideViewerProps {
	partId: number;
	keyboardEnabled?: boolean;
	onPartNavigate?: (direction: "prev" | "next") => void;
}

export function SlideViewer({ partId, keyboardEnabled = false, onPartNavigate }: SlideViewerProps) {
	const [numPages, setNumPages] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(600);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// パディング分(約64px)を引いてスライドが全て見えるようにする
				setContainerWidth(Math.max(entry.contentRect.width - 64, 300));
			}
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// ホスト名 (serve) を明記して、Part-X の大文字小文字がブラウザ内で勝手に小文字に正規化されるのを防ぐ
	const pdfUrl = `asset://serve/Part-${partId}.pdf`;

	function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages);
		setPageNumber(1);
	}

	const handlePrevSlide = () => setPageNumber((prev) => Math.max(prev - 1, 1));
	const handleNextSlide = () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1));

	// キーボードナビゲーション
	useEffect(() => {
		if (!keyboardEnabled) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

			switch (e.key) {
				case "ArrowLeft":
				case "a":
				case "A":
					handlePrevSlide();
					break;
				case "ArrowRight":
				case "d":
				case "D":
					handleNextSlide();
					break;
				case "h":
				case "H":
					if (onPartNavigate) onPartNavigate("prev");
					break;
				case "l":
				case "L":
					if (onPartNavigate) onPartNavigate("next");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [keyboardEnabled, numPages, onPartNavigate]);

	return (
		<div className="flex h-full flex-col overflow-hidden border-r bg-zinc-100 p-4 dark:bg-zinc-900">
			<div
				className="flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden bg-muted/20 p-4"
				ref={containerRef}
			>
				{pdfError ? (
					<div className="p-2 text-center text-destructive">
						{pdfError}
						<br />
						<span className="text-sm opacity-80">(Part-{partId}.pdf)</span>
					</div>
				) : (
					<Document
						file={pdfUrl}
						onLoadSuccess={onDocumentLoadSuccess}
						onLoadError={(err) => setPdfError(err.message)}
						loading={<div className="animate-pulse text-muted-foreground">Loading slide...</div>}
					>
						<Page
							pageNumber={pageNumber}
							renderTextLayer={true}
							renderAnnotationLayer={false}
							className="shadow-xl"
							width={containerWidth} // レスポンシブな幅
						/>
					</Document>
				)}
			</div>

			{/* ページネーションコントロール */}
			<div className="flex shrink-0 flex-col gap-1 border-t bg-card px-4 py-2">
				{/* シークバー */}
				{numPages && numPages > 1 && (
					<input
						type="range"
						min={1}
						max={numPages}
						value={pageNumber}
						onChange={(e) => setPageNumber(Number(e.target.value))}
						className="h-1.5 w-full cursor-pointer accent-primary"
					/>
				)}
				{/* ボタン＋ページ入力 */}
				<div className="flex items-center justify-between">
					<Button variant="outline" size="sm" disabled={pageNumber <= 1} onClick={handlePrevSlide}>
						<ChevronLeft className="mr-1 h-4 w-4" />
						Prev
					</Button>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<input
							type="number"
							min={1}
							max={numPages || 1}
							value={pageNumber}
							onChange={(e) => {
								const v = Number(e.target.value);
								if (v >= 1 && v <= (numPages || 1)) setPageNumber(v);
							}}
							className="w-12 rounded border bg-background px-1.5 py-0.5 text-center text-sm outline-none focus:border-primary"
						/>
						<span className="font-medium">/ {numPages || "?"}</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						disabled={!numPages || pageNumber >= numPages}
						onClick={handleNextSlide}
					>
						Next
						<ChevronRight className="ml-1 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
