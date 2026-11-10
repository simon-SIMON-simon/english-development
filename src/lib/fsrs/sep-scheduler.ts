import { ChunkItem, FSRSRating, ReviewLog, StageNumber } from "@/types/sep";

/**
 * SEP FSRS + Reaction Latency (3000ms Gate) Engine
 *
 * 科学的根拠:
 * - FSRS v4/v5 の DSR (Difficulty, Stability, Retrievability) モデルを実装
 * - Stage 1 において「正答 かつ 反応潜時 3000ms 以下」でない限り、
 *   記憶安定度 S の昇格更新を制限（手続き記憶化の強制）
 * - ステージ昇格基準:
 *   Stage 1: S < 7.0 days
 *   Stage 2: 7.0 <= S < 21.0 days
 *   Stage 3: S >= 21.0 days
 */

export const STAGE1_MAX_LATENCY_MS = 3000;
export const STAGE1_FAST_LATENCY_MS = 1800;
export const STAGE2_PROMOTION_STABILITY_DAYS = 7.0;
export const STAGE3_PROMOTION_STABILITY_DAYS = 21.0;

// FSRS Default Weights (simplified DSR core)
const W = [
  0.4, 0.6, 2.4, 5.8, // Initial stability for ratings 1..4
  4.93, 0.94, 0.86, 0.01, // Difficulty weights
  1.49, 0.14, 0.94, // Recall stability growth weights
  2.18, 0.05, 0.34, 1.26, // Forget stability weights
  0.29, 2.61, // Hard penalty / Easy bonus
];

/**
 * 正誤と反応潜時(ms)から FSRS Rating (1..4) を算出
 */
export function evaluateLatencyRating(
  isCorrect: boolean,
  latencyMs: number,
  stage: StageNumber
): {
  rating: FSRSRating;
  latencyPassed: boolean;
  feedbackLabel: string;
} {
  if (!isCorrect) {
    return {
      rating: 1, // Again
      latencyPassed: false,
      feedbackLabel:
        "❌ 不正解 (Incorrect) — チャンクが一致しないため昇格なし（安定度S据え置き）",
    };
  }

  // 厳格な3000ms反応潜時ゲート
  if (latencyMs <= STAGE1_FAST_LATENCY_MS) {
    return {
      rating: 4, // Easy (即座の手続き記憶検索)
      latencyPassed: true,
      feedbackLabel: `⭕ 正解 & ⚡ Instant Retrieval (${latencyMs}ms ≤ 1800ms) — 大幅ブースト!`,
    };
  }
  if (latencyMs <= STAGE1_MAX_LATENCY_MS) {
    return {
      rating: 3, // Good (3秒以内クリア)
      latencyPassed: true,
      feedbackLabel: `⭕ 正解 & ✅ 3秒以内クリア (${latencyMs}ms ≤ 3000ms) — 安定度S更新!`,
    };
  }
  // 正解だが3000ms超過: 宣言的知識に留まっており自動化されていない
  return {
    rating: 2, // Hard (昇格ブロック)
    latencyPassed: false,
    feedbackLabel: `⭕ 正解 / ⚠️ 3000ms超過 (${latencyMs}ms > 3000ms) — 3秒を超過したため昇格なし（安定度S据え置き）`,
  };
}

/**
 * 記憶安定度 S に基づくステージ判定
 * 不正解の場合、または 3000ms ゲートを通過していない場合は絶対に昇格させない
 */
export function determineStageFromStability(
  stability: number,
  currentStage: StageNumber,
  latencyPassed: boolean,
  isCorrect: boolean = true
): StageNumber {
  if (!isCorrect || !latencyPassed) {
    return currentStage;
  }

  if (stability >= STAGE3_PROMOTION_STABILITY_DAYS) {
    return 3;
  }
  if (stability >= STAGE2_PROMOTION_STABILITY_DAYS) {
    return 2;
  }
  return 1;
}

/**
 * FSRS アルゴリズムによるチャンク状態の更新
 */
export function scheduleChunkReview(
  chunk: ChunkItem,
  isCorrect: boolean,
  latencyMs: number,
  inputMode: "voice" | "typing",
  now: Date = new Date()
): {
  updatedChunk: ChunkItem;
  log: ReviewLog;
  promoted: boolean;
  demoted: boolean;
  feedbackLabel: string;
} {
  const { rating, latencyPassed, feedbackLabel } = evaluateLatencyRating(
    isCorrect,
    latencyMs,
    chunk.stage
  );

  const sBefore = chunk.stability;
  const dBefore = chunk.difficulty;
  const stageBefore = chunk.stage;

  // 経過日数 elapsedDays の計算
  const lastReviewDate = chunk.lastReview ? new Date(chunk.lastReview) : now;
  const elapsedDays = Math.max(
    0.1,
    (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Retrievability R (現在の想起確率)
  const retrievability = Math.pow(1 + elapsedDays / (9 * sBefore), -1);

  // Difficulty D の更新 (1.0 ~ 10.0)
  const deltaD = -W[6] * (rating - 3);
  const nextD = Math.min(
    10.0,
    Math.max(1.0, dBefore + deltaD * ((10 - dBefore) / 9))
  );

  let nextS = sBefore;

  if (!isCorrect || !latencyPassed) {
    // 要件: 「正解かつ3000ms以下の場合のみ、記憶安定度 S が更新され次ステージへの昇格判定が行われる」
    // 不正解の場合、または3000ms超過の場合は安定度 S を据え置きとし、昇格は一切行わない
    nextS = sBefore;
  } else {
    // 正解かつ潜時条件クリア: FSRS 安定度成長式
    const hardPenalty = rating === 2 ? W[15] : 1.0;
    const easyBonus = rating === 4 ? W[16] : 1.0;

    const growthFactor =
      1 +
      Math.exp(W[8]) *
        (11 - nextD) *
        Math.pow(sBefore, -W[9]) *
        (Math.exp((1 - retrievability) * W[10]) - 1) *
        hardPenalty *
        easyBonus;

    // デモや日々のトレーニングで昇格が実感しやすいよう最小成長ステップを保証
    nextS = Math.max(sBefore + (rating === 4 ? 3.5 : 2.2), sBefore * growthFactor);
  }

  nextS = Number(nextS.toFixed(2));
  const nextStage = determineStageFromStability(
    nextS,
    stageBefore,
    latencyPassed,
    isCorrect
  );

  // 次回レビュー予定日
  const intervalDays = !isCorrect || !latencyPassed
    ? 0.5
    : Math.max(1, Math.round(nextS));

  const nextReviewDate = new Date(
    now.getTime() + intervalDays * 24 * 60 * 60 * 1000
  );

  const bestLatencyMs = isCorrect
    ? chunk.bestLatencyMs
      ? Math.min(chunk.bestLatencyMs, latencyMs)
      : latencyMs
    : chunk.bestLatencyMs;

  const updatedChunk: ChunkItem = {
    ...chunk,
    stage: nextStage,
    stability: nextS,
    difficulty: Number(nextD.toFixed(2)),
    reps: chunk.reps + 1,
    lapses: !isCorrect ? chunk.lapses + 1 : chunk.lapses,
    lastLatencyMs: latencyMs,
    bestLatencyMs,
    lastReview: now.toISOString(),
    nextReview: nextReviewDate.toISOString(),
  };

  const log: ReviewLog = {
    id: crypto.randomUUID(),
    chunkId: chunk.id,
    chunkText: chunk.chunkText,
    stageAtReview: stageBefore,
    inputMode,
    isCorrect,
    latencyMs,
    fsrsRating: rating,
    stabilityBefore: sBefore,
    stabilityAfter: nextS,
    stageBefore,
    stageAfter: nextStage,
    reviewedAt: now.toISOString(),
  };

  return {
    updatedChunk,
    log,
    promoted: nextStage > stageBefore,
    demoted: nextStage < stageBefore,
    feedbackLabel,
  };
}
