# 英語力増強Webアプリ「SEP (Speed & Elaboration Pipeline)」

## 1. コンセプトと設計思想

* **目的**: 単なる語彙の丸暗記（受容語彙）を脱却し、自然なコロケーション（チャンク）単位での**「高速な音声知覚（リスニング）」**と**「洗練された表現の瞬時引き出し（スピーキング）」**を同時に自動化する。
* **対象レベル**: TOEIC 935点以上を保有しながらも実践的な運用力（瞬発力・語彙の高度化）に課題を感じる上級者のプラトー打破。
* **科学的根拠**:
  * **検索練習（Testing Effect）**: 受動的な見直しではなく、概念からの能動的かつ時間制限付きの検索で神経回路を強化。
  * **分散学習（FSRS）**: 記憶安定度 $S$（Stability）と難易度 $D$（Difficulty）に基づく最適間隔スケジューリング。
  * **精緻化・二重符号化（Dual Coding）**: 語源（接頭辞・語根）、視覚的イメージ、自己参照文脈（自身の専門領域）の結合。
  * **チャンク化・手続き記憶化**: 単体語ではなく3〜5語の共起チャンクとして登録し、**3000ms（3秒）以内**の反応潜時ゲートによって宣言的記憶から手続き記憶へ転換。
  * **CAF仮説（Complexity, Accuracy, Fluency）**: 制限時間圧縮スプリント（90秒→60秒→45秒）と「安全な基礎語彙への逃げ」を検出する語彙高度化スコア（Lexical Sophistication）。

---

## 2. コア機能：4ステージ昇格型学習パイプライン

各チャンクは、FSRSによる**記憶安定度 $S$（日数）**と**反応潜時（ミリ秒）**に基づき、以下の4つのステージを自動昇格・循環します。

### ■ Stage 0: チャンク登録 & 精緻化エンジン
* 覚えたい単語やフレーズを入力すると、AIが単体語ではなく **3〜5語の自然なコロケーション（共起表現）** に自動変換（例: `be instrumental in`, `raise grave concerns over`）。
* **語源（接頭辞・語根・ニュアンス）**、**視覚的イメージ**、**自己参照例文（専門分野・関心領域に紐づく文脈）**、および**音声変化（IPA・リンキング・弱形解説）**を即座に生成し、二重符号化を完了させます。

### ■ Stage 1: 音声優先・高速検索トレーナー（$S < 7$日）
* **視覚（スペル）非表示**: スペル依存を排するため、最初はテキストを隠して自然な連続音声を知覚。
* **3000ms 反応潜時ゲート**: 日本語の概念トリガー表示から英語チャンクの入力開始（打鍵潜時またはWeb Audio APIによる発話開始Voice Onset）までのミリ秒数を厳密に計測。
* **昇格条件**: 正解かつ **3000ms以下** の場合のみ記憶安定度 $S$ が更新され、$S \ge 7.0$日に到達すると **Stage 2** へ自動昇格します。

### ■ Stage 2: 動的文脈多読 & ゼロから短文生成（$7\text{日} \le S < 21\text{日}$）
* **既知語率98%の200語記事生成**: 該当チャンクを5個束ね、周囲を基礎語彙で固めた約200語の短編記事をリアルタイム生成。
* **1.2倍速リスニング & マイクロ・ディクテーション**: 初回はテキスト非表示・1.2倍速音声で聴解し、リンキング・弱形箇所のディクテーションを実施。
* **Generation Effect（自己文脈短文生成）**: 自分の現実の仕事・開発状況に当てはめたオリジナル短文を作成し、AIがコロケーションの自然度を即時添削。合格により安定度 $S$ が更新され、$S \ge 21.0$日で **Stage 3** へ昇格します。

### ■ Stage 3: AI音声反駁（カウンター）& 圧縮スプリント（$S \ge 21\text{日}$）
* **AI音声反駁**: AIが専門トピックに関して鋭い反論や挑発的な質問を音声で投げかけます。
* **強制チャンク使用 & 90秒 → 60秒 → 45秒 圧縮スプリント**: 画面上に指定された複数の定着チャンクを**必ず使って**即座に言い返します。同じ主張を「90秒 → 60秒 → 45秒」と制限時間を縮めながら発話し、言い淀みを削ぎ落とします。
* **評価メトリクス**:
  * **発話速度（WPM）** と **0.5秒（500ms）以上のポーズ率（言い淀み）** をWeb Audio APIで計測。
  * `good`, `important`, `I think` 等の安全な基礎語彙への逃げを検出し、**語彙高度化スコア（Lexical Sophistication Score: 0〜100）** とCAFスコアを算出。

---

## 3. 標準搭載：4大学術コーパス学習セット

応用言語学・第二言語習得論（SLA）における著名な4大標準コーパスリストを学習セットとしてプリセット搭載しています。各セットは語源・視覚イメージ・自己参照文脈（二重符号化）および音声変化解説（IPA・リンキング）が完備されており、個別インポートまたは一括インポートが可能です。

1. **Phrasal Expressions List (PEL)** (Martinez & Schmitt, 2012)
   - ネイティブスピーカーの巨大コーパス（BNC）から抽出された最重要定型表現（505表現）。単語単体ではなく慣用連語として自動化することで、リスニングの知覚負荷を劇的に低減。
   - 例: `in the light of`, `with regard to the`, `in conjunction with`, `to a large extent`, `at the expense of`
2. **Academic Collocation List (ACL)** (Ackermann & Chen, Pearson, 2013)
   - 学術・知的ビジネス議論において必須となる最重要コロケーション（2,469組）。動詞・名詞・形容詞の自然な共起パターンを手続き記憶化。
   - 例: `draw a clear distinction between`, `cast serious doubt on`, `shed new light on`, `strike a delicate balance between`, `yield tangible results in`
3. **Academic Formulas List (AFL)** (Simpson-Vlach & Ellis, 2010)
   - 学術スピーキングおよびライティングにおいて論理展開・立場表明・議論接続を司る定型フォーミュラ（談話標識）。
   - 例: `it should be noted that`, `on the basis of`, `there is no doubt that`, `as can be seen from`, `it is worth pointing out that`
4. **Phrasal Verb Pedagogical List (PVPL)** (Garnier & Schmitt, 2015)
   - 現代英語で最も頻出かつ不可欠な150の句動詞とそのコア意味を網羅。口語やビジネス対話における瞬時の知覚・発話を鍛錬。
   - 例: `carry out rigorous testing`, `point out the inconsistency in`, `set up a scalable architecture`, `figure out the root cause`, `rule out the possibility of`

---

## 4. デイリーワークアウトの流れ（1日15〜20分完結）

1. **Phase 1: 瞬間検索スプリント（4分）** ── Stage 1の聴覚・発話フラッシュカード（3000msミリ秒計測）
2. **Phase 2: 記事リスニング & マイクロ短文生成（6分）** ── Stage 2の1.2倍速多聴・ディクテーション・自己文脈短文添削
3. **Phase 3: AI反駁スプリント（5分）** ── Stage 3の制限時間（90/60/45秒）音声ディベート＆高度語彙チェック

---

## 4. 技術スタック & ディレクトリ構成

* **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
* **音声・ミリ秒計測**: Web Audio API (`AudioContext`, `AnalyserNode` によるVoice Onset検知・500msポーズ検知), Web Speech API (TTS / STT), `performance.now()`
* **記憶スケジューラ**: FSRS (Free Spaced Repetition Scheduler) × 3000ms反応潜時カスタムゲート (`src/lib/fsrs/sep-scheduler.ts`)
* **AIレイヤー**: Google Gemini API (`@google/genai` 構造化JSON出力) ＋ ローカル推論フォールバックエンジン（APIキー未設定時でも全ステージ完全動作）
* **データベース設計**: Supabase PostgreSQL (`supabase/migrations/0001_init_sep_schema.sql`) ＋ ローカル永続化ストア (`src/lib/store/sep-store.ts`)

```text
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chunks/elaborate/route.ts   # Stage 0: 3〜5語チャンク化 & 二重符号化API
│   │   │   └── workout/
│   │   │       ├── stage2/route.ts         # Stage 2: 既知語率98%記事生成 & 短文添削API
│   │   │       └── stage3/route.ts         # Stage 3: AI反駁生成 & 語彙高度化スコア評価API
│   │   ├── layout.tsx
│   │   └── page.tsx                        # ダッシュボード & 15分デイリーワークアウト統合画面
│   ├── components/
│   │   ├── stage0/Stage0Elaborator.tsx     # Stage 0 チャンク登録・精緻化UI
│   │   ├── stage1/Stage1Trainer.tsx        # Stage 1 音声優先・3000ms高速検索トレーナー
│   │   ├── stage2/Stage2Trainer.tsx        # Stage 2 1.2x多聴・ディクテーション・短文生成UI
│   │   └── stage3/Stage3Trainer.tsx        # Stage 3 AI反駁・90/60/45秒圧縮スプリントUI
│   ├── lib/
│   │   ├── audio/audio-engine.ts           # Web Audio VAD発話潜時・ポーズ率・WPM計測エンジン
│   │   ├── fsrs/sep-scheduler.ts           # FSRS記憶安定度 S × 3000ms潜時判定ロジック
│   │   └── store/sep-store.ts              # 初期シードチャンク & 永続化ストア
│   └── types/sep.ts                        # 型定義
└── supabase/
    └── migrations/0001_init_sep_schema.sql # Supabase PostgreSQL スキーマ定義
```

---

## 5. セットアップとローカル起動方法

### 1. パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定（任意）
`.env.example` をコピーして `.env.local` を作成するか、アプリ画面右上の**設定（歯車アイコン）**から `GEMINI_API_KEY` を設定できます（未設定でも内蔵の推論フォールバックエンジンにより全機能を即座に試用可能です）。

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスしてください。
