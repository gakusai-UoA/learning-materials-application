---
marp: true
theme: default
paginate: true
header: "現代的Web開発・基礎勉強会"
footer: "Section 00: Git & GitHub Foundation"
backgroundColor: #ffffff
style: |
  section {
    font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
    font-size: 22px;
    line-height: 1.6;
    color: #451a03;
  }
  h1 {
    color: #854d0e;
    border-bottom: 3px solid #ffd41d;
    font-size: 36px;
    padding-bottom: 10px;
  }
  h2 {
    color: #a16207;
    font-size: 28px;
    margin-top: 20px;
    border-left: 8px solid #ffd41d;
    padding-left: 15px;
  }
  h3 {
    color: #854d0e;
    font-size: 24px;
    margin-top: 15px;
  }
  code {
    background: #fffcf0;
    color: #a16207;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-weight: bold;
    font-family: 'Menlo', 'Monaco', monospace;
  }
  pre {
    background: #fffdf5;
    color: #451a03;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ffd41d;
    font-size: 18px;
  }
  pre code {
    background: transparent;
    color: inherit;
    font-weight: normal;
  }
  strong {
    color: #a16207;
    font-weight: bold;
  }
  table {
    font-size: 18px;
    width: 100%;
    margin: 20px 0;
    border-collapse: collapse;
  }
  th {
    background-color: #fff9db;
    color: #854d0e;
    padding: 10px;
  }
  td {
    padding: 10px;
    border-bottom: 1px solid #fef3c7;
  }
  .small-text {
    font-size: 16px;
    color: #713f12;
  }
missionID: 6e832aa6-9f12-4c22-b5e2-2a0f8b7f1d3c
startSlide: 1
endSlide: 20
slideIDs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
---

# Section 00: Git & GitHub 基礎

## バージョン管理とクラウドでの共有をマスターする

これからのチーム開発で必須となるツールの使い方を、**実際に手を動かしながら**ゼロから学びましょう。

---

## 0. ハンズオン：Antigravity（AIエディタ）を使える状態にしよう

### Step 1: サイトにアクセスしてログイン

- ブラウザ（Chrome 推奨）で **`https://antigravity.google/`** を開く
- 画面右上の **「Sign in」** から、Google アカウントでログインする

---

### Step 2: エディタをインストール

- 画面中央または上部にある **「Download Antigravity」** ボタンをクリック
- 自分の OS に合ったインストーラを選ぶ
  - **Windows**: `Download for Windows`
  - **macOS**: `Download for macOS`
- ダウンロードしたインストーラを実行し、案内に従って進める（基本はすべて「Next」で OK）

---

### Step 3: 初回起動とワークスペース準備

- インストールした Antigravity を起動する
- 初回起動時に表示される **「Sign in with Google」** ボタンからログイン（Step 1 と同じアカウント）
- 「New Project」や「Open Folder」などのボタンが表示されれば準備完了  
  → この後のセクションで作る Git リポジトリや Vite プロジェクトを、Antigravity で開いて開発していきます。

---

## 1. そもそも Git と GitHub とは？

チームで開発を行う際、必ず直面する問題があります。

- 「誰がどこを変更したかわからない！」
- 「前の状態に戻したいけど、上書きしてしまった…」
- 「最終版(3).zip みたいなファイルが無限に増える」

これを根本から解決するのが **「バージョン管理システム」** です。

---

### Git（ギット）：最強のタイムマシン

Gitは、ファイルに対する全ての変更履歴を記録し、**いつでも過去の状態に戻せる**ようにする仕組み（ツール）です。

- **作業の「スナップショット」を保存**: 「昨日の変更」と「今日の変更」を手軽に見比べられます。
- **ローカル（手元のパソコン）で動く**: インターネットがなくても変更履歴を管理できます。

---

### GitHub（ギットハブ）：クラウド上の書庫

GitHubは、Gitで管理している変更履歴のデータをインターネット上で共有・保存できる**「クラウドサービス」**です。

- **チームメンバーと連携**: みんなで同じファイル群（リポジトリ）を持ち寄って結合できます。
- **バックアップ**: ローカルのPCが壊れても、GitHub上にデータが残っていれば安心です。

---

## 2. ローカルとリモートの関係

Gitの作業は、大きく「ローカル（自分のPC）」と「リモート（GitHub）」での通信に分かれます。まずは全体の流れを図解で理解しましょう。

![width:100%](../assets/part0-git-flow.png)

---

## 3. ハンズオン：準備編

ここからは実際にターミナル（WindowsならPowerShell/WSL、MacならTerminal）を開いて操作します。

### まずはGitをインストールしよう

まだPCにGitが入っていない場合は、以下の手順でインストールします。

- **Windowsの方**:
  [Git for Windows](https://gitforwindows.org/) にアクセスし、インストーラーをダウンロードして実行してください。設定はすべてそのまま「Next」で進めてOKです。
- **Macの方**:
  ターミナルを開いて `xcode-select --install` と入力し、案内画面に従ってインストールします（または [公式サイト](https://git-scm.com/download/mac) からインストーラーを利用）。

---

### インストールの確認

無事にインストールが終わったら、ターミナルで以下のコマンドを打ってみましょう。

```bash
git --version
```

`git version 2.xx.x` のように表示されればOKです！

---

### 自分の名前とメールアドレスを登録

チーム開発において、「誰がその変更をしたか」を記録するために、最初に一度だけ情報を登録します。

```bash
# 自分の名前に置き換えて実行
git config --global user.name "Your Name"

# 自分のメールアドレスに置き換えて実行
git config --global user.email "your.email@example.com"
```

_※これはPC全体の設定になります。_

---

## 4. ハンズオン：ローカルで履歴を作る

まずはクラウド（GitHub）のことは忘れましょう。
自分のパソコンの中だけで「セーブデータ」を作ってみます。

### Step 1: 実験用のフォルダを作って移動する

```bash
mkdir git-practice
cd git-practice
```

---

### Step 2: `git init` (Gitの管理を開始)

このフォルダを「Gitで履歴を管理する箱（レポジトリ）」に進化させます。

```bash
git init
```

> `Initialized empty Git repository in ...` と表示されれば成功です！
> これでこのフォルダは、ただのフォルダから**魔法のフォルダ**になりました。

---

### Step 3: ファイルを作成してみる

テキストファイルを作って、何か書き込んでみましょう。

```bash
echo "Hello Git!" > hello.txt
```

現在のGitの状態を確認する魔法のコマンド `git status` を打ってみます。

```bash
git status
```

赤字で `hello.txt` （まだGitが追跡していないファイル）が表示されます。

---

### Step 4: `git add`（箱詰め・ステージング）

ファイルの変更を行ったら、まずは **「どの変更を次回のセーブデータに含めるか」** を選びます。

```bash
# hello.txt をセーブ対象として選ぶ
git add hello.txt

# (参考) フォルダ内のすべての変更をまとめて選ぶ場合は `git add .`
```

もう一度 `git status` を打つと、`hello.txt` が緑色（セーブ準備完了）になっているはずです！

---

### Step 5: `git commit`（セーブの確定）

箱に荷物を詰め終わったら、**「どんな変更をしたか」わかるメッセージ（ラベル）を貼って封印**します。これが1つの「セーブデータ」です。

```bash
git commit -m "初めてのコミット：挨拶を追加"
```

これでローカル（自分のPC）に歴史が1ページ刻まれました！

---

### Step 6: 履歴を確認する `git log`

ちゃんとセーブデータが作られたか、過去の歴史を振り返ってみましょう。

```bash
git log
```

先ほど設定した「あなたの名前」と、「初めてのコミット：挨拶を追加」というメッセージ、そして英数字の羅列（コミットID）が表示されていれば完璧です！（終了するには `q` キーを押します）

---

## 5. ハンズオン：GitHubと繋げる

今のままではデータは自分のPCの中にしかありません。
これをGitHubにアップロード（共有）してみましょう！

### Step 1: GitHub上に「空の倉庫」を作る

1. GitHub (https://github.com) にログイン。
2. 右上の `+` ボタンから **「New repository」** を選択。
3. Repository name に `git-practice` と入力。
4. そのまま一番下の緑のボタン **「Create repository」** をクリック！

---

### Step 2: リモートリポジトリとの通信設定

GitHubが「これを自分のPCで実行してね」と教えてくれるコマンドをコピペして実行します。

```bash
# メインのブランチ名を "main" に統一する（最近の標準です）
git branch -M main

# 先ほど作ったGitHubの空倉庫(_あなたのユーザー名_)を "origin" という名前で登録
git remote add origin https://github.com/あなたのユーザー名/git-practice.git
```

これで、手元のPCとGitHubが一本の線で繋がりました。

---

### Step 3: `git push`（クラウドへアップロード）

いよいよ手元のセーブデータをクラウドに送信します！

```bash
# "origin" (GitHub) の "main" ブランチへデータを送る！
# (-u は次回以降 git push だけで送れるようにする便利オプション)
git push -u origin main
```

ブラウザで先ほどのGitHubのページをリロード（F5）してみてください！
あなたが書いた `hello.txt` が表示されているはずです！🎉

---

## 6. ハンズオン：チーム作業のシミュレーション

チーム開発では、「他の人がGitHubに反映した最新の変更」を自分のPCに取り込む作業が頻繁に発生します。

### GitHub上で直接ファイルを変更してみる

1. GitHubのページで `hello.txt` をクリックし、鉛筆アイコン(Edit)を押します。
2. 2行目に `This is from GitHub!` と追記します。
3. 下の **「Commit changes」** ボタンを押して保存します。

_※これで、「クラウド上の方が、手元のPCより進んでいる状態」になりました。_

---

### `git pull`（最新版のダウンロード）

あなたの手元のPCは、まだ2行目が追加されていない古い状態です。
GitHubから最新の歴史をダウンロード（同期）しましょう！

```bash
git pull origin main
```

ファイルの中身を確認してみましょう。

```bash
cat hello.txt
```

クラウドでの変更が手元に反映されていれば成功です！

---

## 7. 基本コマンド早見表まとめ（チートシート）

| コマンド                  | やること（意味）                     | タイミング                   |
| :------------------------ | :----------------------------------- | :--------------------------- |
| **`git clone <URL>`**     | GitHubの倉庫をPCに丸ごとコピー       | プロジェクト参加時(初回のみ) |
| **`git pull`**            | クラウドの最新変更を手元に反映       | **作業を始める前**に必ず実行 |
| **`git status`**          | 現在の変更状況を確認                 | 迷ったらとりあえず打つ       |
| **`git add .`**           | 変更したファイルをセーブ対象に選ぶ   | 作業が一区切りした時         |
| **`git commit -m "..."`** | メッセージを付けて歴史に保存         | `add` の直後                 |
| **`git push`**            | 保存した歴史をクラウドにアップロード | セーブをみんなに共有したい時 |
| **`git log`**             | 過去の歴史(コミット履歴)を振り返る   | 過去の変更を確認したい時     |
