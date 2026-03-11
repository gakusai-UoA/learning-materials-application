# 現代的Web開発 学習アプリケーション (Study Group App)

これは勉強会用（GDGoC等）として開発された、Electronベースのローカル学習・ハンズオンアプリケーションです。

## 主な機能

- **スライド連動:** 左側にPDFスライドを表示しながら右側でコーディングが可能。
- **Monaco Editor 内蔵:** インテリジェントなコード補完やハイライトに対応したエディタを搭載。
- **バックグラウンドフォーマット:** `Biome.js` を用いて、保存時にバックグラウンドで自動的にコードをフォーマットします。エディタ上に赤いエラー等は出さないため初学者にも優しい設計です。
- **IPC連携・自動環境構築:** アプリ起動時に `pnpm` を自動でチェック・インストールし、ローカルの `~/LearningAppWorkspace` (テンプレートプロジェクトディレクトリ) とファイル同期します。
- **シームレスなサーバー起動:** 「Run」ボタン一つで、裏側でViteやWranglerによる開発サーバーを起動し、専用のプレビュータブから表示を確認できます。

## 起動手順（開発・テスト用）

本プロジェクトを実行するには以下の手順を踏みます。

```bash
# パッケージのインストール
pnpm install

# 開発モードでアプリを起動 (HMR 対応)
pnpm run dev

# (任意) TypeScriptの型チェック
pnpm run typecheck

# (任意) アプリケーションのビルド (配布用)
pnpm run build
```

## ディレクトリ構成

- `src/main`: Electron ネイティブ処理（IPC ハンドラ: サーバー起動、ファイル操作、Biome 実行）
- `src/preload`: フロントエンドに `window.api` を露出するブリッジAPI
- `src/renderer`: フロントエンド UI (React, Tailwind CSS v4, shadcn/ui)
  - `pages/StartMenu.tsx`: メニュー一覧
  - `pages/LearningView.tsx`: 勉強会用スプリットビュー画面
  - `components/SlideViewer.tsx`: PDF スライド閲覧ペイン
  - `components/WorkspacePane.tsx`: エディタとプレビューの切り替えペイン

## 使い方 (勉強会時)

1. 起動すると、パート一覧が表示されたスタート画面 (`StartMenu`) に遷移します。
2. 任意のパートを選択すると、`~/LearningAppWorkspace/Part-X` スペースがロードされます。
3. エディタ上でコードを変更すると、自動的にローカルファイルに同期され、背景で `Biome.js` によるフォーマットが適応されます。
4. 「Run」ボタンを押すことで、対象パートに応じた開発サーバー (`pnpm run dev` または `pnpm run deploy`) が起動し、プレビューから確認できます。
