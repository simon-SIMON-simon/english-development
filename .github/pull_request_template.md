## 概要
英語力増強Webアプリ **「SEP (Speed & Elaboration Pipeline)」** の全4ステージ学習パイプライン、4大学術コーパス学習セット（PEL / ACL / AFL / PVPL：重複排除済み3,520表現）、Phase 1の2ステップ（音声検索＋ミニ例文穴埋め）構成、ミニマルUI整理、およびGemini APIキーのサーバーサイド専用セキュア化を実装しました。

## 主な変更点・実装機能
- [x] **4大学術コーパス学習セット完全収録（重複排除後 3,520ユニーク表現・全Phase対応）** (`src/lib/data/corpus-catalog.ts`, `src/lib/data/learning-sets.ts`)
  - **PEL (Phrasal Expressions List)**: 505表現
  - **ACL (Academic Collocation List)**: 原典2,469表現（リスト間重複排除後 2,265表現）
  - **AFL (Academic Formulas List)**: 600表現
  - **PVPL (Phrasal Verb Pedagogical List)**: 全150句動詞網羅
  - すべての表現を Phase 1・Phase 2・Phase 3 の全トレーニングでシームレスに使用可能
- [x] **Phase 1（Stage 1）の2ステップ構成 & 厳格な正誤判定** (`src/components/stage1/Stage1Trainer.tsx`, `src/lib/fsrs/sep-scheduler.ts`)
  - **Step 1（瞬間音声検索）**:
    - `Space` キーで即時開始・次へ遷移可能
    - 音声再生中から即座にタイピング可能、かつ回答確定まで日本語訳・ヒント・不要なインジケーターを完全非表示化（予測防止）
    - 語単位の厳格な正誤判定（不一致箇所の差分表示付き）を導入し、不正解時または3000ms超過時は昇格なし（記憶安定度 $S$ 据え置き）
    - 結果画面に「入力チャンク」「正解チャンク」「チャンクの日本語意味」「解説」を表示
  - **Step 2（実践ミニ例文の穴埋め）**:
    - 同じチャンクを自然な文脈に組み込んだ実践ミニ例文の穴埋め（Cloze）トレーニング
    - 確定時に正誤判定・完成文ハイライト表示・全文の英語音声読み上げを実施
- [x] **UIのミニマル化・画面情報のそぎ落とし** (`src/app/page.tsx`, `Stage1Trainer.tsx`, `Stage2Trainer.tsx`, `Stage3Trainer.tsx`)
  - 重複していた上部ナビゲーション・説明バナーを廃止し、1行のスリムなヘッダーバーへ集約
  - 起動直後にPhase 1トレーニング画面へ直行するクリーンなレイアウトに変更
- [x] **Gemini APIキーのセキュリティ強化（サーバーサイド完全分離）** (`.gitignore`, `.env.example`, `/api/**`)
  - クライアント側（`localStorage` やリクエストペイロード）でのAPIキー保持・送信を廃止し、サーバーサイドの `process.env.GEMINI_API_KEY`（`.env.local`）のみから参照するようセキュア化
- [x] **Stage 0 / Stage 2 / Stage 3 & データベース設計**
  - Stage 0 チャンク精緻化エンジン (`/api/chunks/elaborate`)
  - Stage 2 既知語率98%の200語記事生成・1.2倍速聴解・短文添削 (`/api/workout/stage2`)
  - Stage 3 AI音声反駁・90s/60s/45s圧縮スプリント・WPM/ポーズ率/語彙高度化スコア評価 (`/api/workout/stage3`)
  - Supabase PostgreSQL マイグレーション (`supabase/migrations/0001_init_sep_schema.sql`)

## 動作確認手順
1. `.env.local` の `GEMINI_API_KEY=` に Gemini APIキーを設定（未設定でも内蔵フォールバックエンジンで動作）
2. `npm install`
3. `npm run dev`
4. `http://localhost:3000` にアクセスし、Phase 1（Step 1: 音声検索 → Step 2: ミニ例文穴埋め）、Phase 2、Phase 3 の動作を確認
