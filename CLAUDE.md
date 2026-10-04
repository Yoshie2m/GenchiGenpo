# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクトの状況

DDD で設計を進めながら、**フロントエンドだけで動く PoC**（Vite + React + TypeScript、データは localStorage）を作っている段階。PoC のタスクは `TASK.md` の「PoC」の欄にある。

## コマンド

Node は `.nvmrc`（26）。

```bash
npm install          # 依存パッケージのインストール
npm run dev          # 開発サーバー
npm test             # テスト（Vitest）
npx vitest run src/ui/App.test.tsx   # 1ファイルだけテストする
npm run test:watch   # 変更を見てテストを繰り返す
npm run lint         # ESLint（依存の向きのルールを含む）
npm run format       # Prettier で整形（*.md は対象外）
npm run format:check # 整形の確認のみ
npm run build        # 型チェック（tsc -b）とビルド
npm run master-data  # md（hq-to-shintora-route.md・team-tokaido-mobility-map.md）からマスターデータを作り直す
```

GitHub Actions（`.github/workflows/ci.yml`）が push と Pull Request のたびに、整形チェック・lint・テスト・ビルドと、マスターデータが md と一致するかを確かめる。push する前に、手元で同じコマンドが通ることを確かめること。

## コードの構成

- `src/` はコンテキスト（`stepRecord` / `teamMission` / `personalMission` / `missionCandidate` / `member`）ごとに分け、その中を `domain/` / `application/` / `infrastructure/` に分ける。コンテキスト間の型は `publishedLanguage/`、共通の部品は `shared/`、画面は `ui/`。詳細は ARCHITECTURE.md「3. レイヤー構造」。
- 依存の向きは `eslint.config.js` で強制している。コンテキスト同士を直接 import しない、`domain/` は React や他レイヤーに依存しない、`ui/` は `application/` だけを呼ぶ。
- `src/composition.ts` がアプリの組み立て（依存の注入）を行う。各コンテキストのサービスを作り、`shared/EventBus.ts` で「歩数が記録された」を個人ミッションとチームミッションに配送する。コンテキスト間の問い合わせ（メンバーの一覧、平均歩数、ミッション候補）は `publishedLanguage/queries.ts` のインターフェースで渡す。
- 時刻で起きること（開始時のチーム振り分け、途中参加、次のミッションの自動確定）は `TeamMissionService.tick()` でまとめて進める。画面の表示や操作のたびに呼ばれる。
- PoC は初めて開いたときにダミーメンバー10人を入れる（`src/dev/demoData.ts`）。画面上部の「開発用」で、メンバーの切り替え・日付を進める・ほかのメンバーの歩数を入れる・初期化ができる。
- コードの名前は DOMAINS.md のユビキタス言語の英語名（例: 進行歩数 = ProgressSteps）に合わせる。
- 通過点（`src/personalMission/masterData/tokaidoRoute.ts`）とミッション候補（`src/missionCandidate/masterData/missionCandidates.ts`）は、md から `scripts/generate-master-data.mjs` で作る生成物。直接編集せず、md を直して `npm run master-data` を実行する。
- tsconfig の `erasableSyntaxOnly` が有効なため、コンストラクタ引数でのプロパティ宣言（`constructor(private readonly x: X)`）や enum は使えない。

## アプリ概要

GenchiGenpo（現地現物）は、和風・現場主義のチーム対抗ウォーキングアプリ。メンバーの日々の歩数を「現地現物へのパトロール（巡回）」に見立て、宿場町・海外工場・テストコースなどの目的地を目指しながら、チームで歩数を競う。

## 技術方針（README より）

- **フロントエンド（候補）:** Next.js（Webアプリ / PWA化）。iOS のブラウザからは歩数データを直接取得できないため、Google Fit などの外部クラウドAPI、または Fitbit 等のスマートウォッチAPIとの連携が必要。対象OS・端末（iPhone / Android の比率、スマートウォッチ連携の要否）は未確定のため、歩数取得方式を決める前に確認すること。
- **バックエンド:** Supabase（PostgreSQL）を採用。「ユーザー」「チーム」「歩数履歴」をリレーショナルに設計できること、無料プランのままなら自動で有料に移行しないこと、標準でAPIのレートリミットがあることが選定理由。

## 絶対条件

- **無料枠内での運用が必須。** 予期せぬ大量アクセスによる高額課金（パケ死）が起こりうる設計は避ける。
- **バックエンドの手前で認証を必須とする。** 不正なBotやスクリプトによるデータの読み書きを遮断するため、未認証でデータにアクセスできる経路を作らないこと。

## データモデル

README のスキーマ（`users`・`teams`・`steps`、`steps` のIDは `ユーザーID_日付`）は Firestore のコレクション前提で書かれた**参考資料**にすぎない。正式なモデルは DDD で別途設計するため、確定したスキーマとして扱わないこと。

## DDD による設計の進め方（3ファイルの使い分け）

設計はユーザー（ドメインエキスパート）との対話を通じて DDD で進め、結果を次の3ファイルに振り分けて記録する。

| ファイル | 書くこと | 書かないこと |
|---|---|---|
| `TASK.md` | 直近のタスク、対話で出た宿題、概念整理のタスク（例: コンテキスト境界の定義） | 結論そのもの（完了したら他の2ファイルに反映する） |
| `DOMAINS.md` | ユビキタス言語辞書、境界づけられたコンテキスト、Entity / Value Object とビジネスルール、ドメインイベント | **技術的な話（DB、フレームワーク、API、画面など）は一切書かない** |
| `ARCHITECTURE.md` | レイヤー構造、AI の推奨設計案の比較、Repository、DB 設計、Application Service | ビジネスルールの新規定義（先に DOMAINS.md で決める） |
| `hq-to-shintora-route.md` | 個人ミッションの固定ルート（東海道五十三次）の概要と通過点の一覧・累計歩数・一口メモ | ルールそのもの（DOMAINS.md の「個人ミッション」に書く） |
| `team-tokaido-mobility-map.md` | チームミッションの目的地（ミッション候補）の一覧と、到達日数・中間地点の目安 | ルールそのもの（DOMAINS.md に書く） |

運用ルール:
- 用語は `DOMAINS.md` の辞書に定義してから使う。`ARCHITECTURE.md` やコードでも辞書と同じ名前を使う。
- AI の提案は `【仮】` / `【検討中】` として書き、ユーザーが合意したものだけ `【確定】` / `【採用】` にする。AI が勝手に確定扱いにしない。
- 設計案を出すときは選択肢を比較したうえで推奨案と理由を示し、`ARCHITECTURE.md` の「推奨設計案の比較」に残す。却下した案も理由とともに残す。
- 対話で未決の論点や宿題が出たら `TASK.md` に追加する。タスクが完了したら結論を該当ファイルに反映し、`TASK.md` では「完了」に移す。

## デザインシステム

画面はデザインシステム「歩（ほ）」（https://claude.ai/artifact/84sXxh4US9sshyPAgtgZCF）に従う。画面を作る前に、Artifact の read で `project/README.md` と `project/tokens.json` を読む。要点と GenchiGenpo との食い違いは ARCHITECTURE.md「2.1 デザインシステム」にまとめてある。

## 言語

プロジェクトのドキュメントは日本語で書かれている。特に指示がない限り、新しいドキュメントも日本語で統一する。
