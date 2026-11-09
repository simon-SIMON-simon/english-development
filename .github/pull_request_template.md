## 概要
英語力増強Webアプリ **「SEP (Speed & Elaboration Pipeline)」** の初期設計・全4ステージ学習パイプラインおよびデイリーワークアウト機能を実装しました。

## 主な変更点・実装機能
- [x] **Stage 0: チャンク登録 & 精緻化エンジン** (`src/components/stage0/Stage0Elaborator.tsx`, `/api/chunks/elaborate`)
  - 入力語彙を3〜5語の自然なコロケーションへ自動変換
  - 語源（接頭辞・語根）、視覚的イメージ、自己参照文脈、IPA・リンキング解説の二重符号化生成
- [x] **Stage 1: 音声優先・高速検索トレーナー** (`src/components/stage1/Stage1Trainer.tsx`, `src/lib/fsrs/sep-scheduler.tsx`)
  - スペル非表示による音声プライミングと日本語概念からの即答トレーニング
  - 打鍵開始およびWeb Audio API (VAD) による発話開始ミリ秒（Reaction Latency）の計測
  - 正解かつ3000ms以下の場合のみFSRS記憶安定度 $S$ を更新し、$S \ge 7$日でStage 2へ自動昇格
- [x] **Stage 2: 動的文脈多読 & ゼロから短文生成** (`src/components/stage2/Stage2Trainer.tsx`, `/api/workout/stage2`)
  - $S \ge 7$日のチャンク5個を束ねた既知語率98%の200語短編記事生成
  - 1.2倍速リスニング、リンキング・弱形箇所のマイクロ・ディクテーション
  - 自己文脈でのオリジナル短文作成（Generation Effect）とAIコロケーション添削
- [x] **Stage 3: AI音声反駁 & 圧縮スプリント** (`src/components/stage3/Stage3Trainer.tsx`, `/api/workout/stage3`)
  - $S \ge 21$日の定着チャンクを強制使用するAIカウンターディベート
  - 90秒 → 60秒 → 45秒の制限時間圧縮スプリント
  - WPM・0.5秒以上のポーズ率計測、および基礎語彙への逃げを検出する「語彙高度化スコア（Lexical Sophistication Score）」算出
- [x] **データベース設計 & ドキュメント**
  - Supabase PostgreSQL マイグレーション (`supabase/migrations/0001_init_sep_schema.sql`)
  - 日本語 `README.md` の整備

## 動作確認手順
1. `npm install`
2. `npm run dev`
3. `http://localhost:3000` にアクセスし、ダッシュボードから「今日のワークアウトを開始（Phase 1〜3）」または各ステージタブ（Stage 0〜3）の動作を確認
