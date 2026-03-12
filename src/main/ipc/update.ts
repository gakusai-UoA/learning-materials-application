import * as fs from "node:fs";
import { join } from "node:path";
import { app, ipcMain, net, shell } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";

export function setupUpdateHandlers() {
	// Log Setup
	log.transports.file.level = "info";
	autoUpdater.autoDownload = false;

	ipcMain.handle("check-update", async (event) => {
		if (!app.isPackaged) {
			return false; // 開発環境はスキップ
		}

		return new Promise<boolean>((resolve) => {
			const sender = event.sender;
			const sendProgress = (msg: string) => {
				sender.send("env-progress", msg);
			};

			// アップデートイベントの紐付け
			autoUpdater.once("checking-for-update", () => {
				sendProgress("アップデートを確認しています...");
			});

			autoUpdater.once("update-available", (info) => {
				sendProgress(`最新バージョン v${info.version} をダウンロードしています...`);

				if (process.platform === "darwin") {
					// macOS向け手動ダウンロード
					const archSuffix = process.arch === "arm64" ? "-arm64" : "-x64";
					const url = `https://github.com/gakusai-UoA/learning-materials-application/releases/download/v${info.version}/learning-material-${info.version}${archSuffix}.dmg`;

					const tempPath = join(app.getPath("temp"), `learning-material-${info.version}.dmg`);
					const file = fs.createWriteStream(tempPath);

					net.fetch(url)
						.then(async (res) => {
							if (!res.ok) throw new Error(`Unexpected response ${res.statusText}`);
							if (res.body) {
								const reader = res.body.getReader();
								// ダウンロード進捗の計算用 (おおよそのサイズがあれば)
								const contentLength = res.headers.get("content-length");
								let receivedLength = 0;

								while (true) {
									const { done, value } = await reader.read();
									if (done) break;
									file.write(value);
									
									if (contentLength && value) {
										receivedLength += value.length;
										const percent = Math.round((receivedLength / parseInt(contentLength)) * 100);
										sendProgress(`最新バージョン v${info.version} をダウンロードしています... ${percent}%`);
									}
								}
								file.end();
							}
						})
						.then(() => {
							file.close(() => {
								sendProgress("ダウンロード完了。インストーラを起動します...");
								shell.openPath(tempPath);
								setTimeout(() => app.quit(), 1000);
							});
						})
						.catch((err) => {
							log.error("Download failed:", err);
							sendProgress("ダウンロードに失敗しました。このまま起動します。");
							setTimeout(() => resolve(false), 2000);
						});
				} else {
					// Windows/Linux Auto Download
					autoUpdater.downloadUpdate();
				}
			});

			autoUpdater.once("update-not-available", () => {
				resolve(false);
			});

			autoUpdater.once("error", (err) => {
				log.error("Update error:", err);
				resolve(false);
			});

			autoUpdater.on("download-progress", (progressObj) => {
				const percent = Math.round(progressObj.percent);
				sendProgress(`最新バージョンをダウンロードしています... ${percent}%`);
			});

			autoUpdater.once("update-downloaded", () => {
				sendProgress("ダウンロード完了。再起動してインストールします...");
				setTimeout(() => {
					autoUpdater.quitAndInstall(true, true);
				}, 1000);
			});

			// チェック開始
			autoUpdater.checkForUpdates();
		});
	});
}
