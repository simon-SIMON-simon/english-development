"use client";

import React, { useState, useEffect } from "react";
import {
  ChunkItem,
  ReviewLog,
  SentenceFeedback,
  Stage2PassageData,
  UserProfile,
} from "@/types/sep";
import { speakEnglishText } from "@/lib/audio/audio-engine";
import { scheduleChunkReview } from "@/lib/fsrs/sep-scheduler";
import {
  BookOpen,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Send,
  RefreshCw,
  ArrowRight,
  Shuffle,
} from "lucide-react";

interface Stage2TrainerProps {
  chunks: ChunkItem[];
  profile: UserProfile;
  onChunkUpdated: (updated: ChunkItem, log: ReviewLog) => void;
  onPhaseComplete?: () => void;
}

export default function Stage2Trainer({
  chunks,
  profile,
  onChunkUpdated,
  onPhaseComplete,
}: Stage2TrainerProps) {
  // リスト内のすべての表現を5個単位のバッチまたはランダムで切り替え可能にする
  const [batchStartIndex, setBatchStartIndex] = useState(0);
  const [customBundled, setCustomBundled] = useState<ChunkItem[] | null>(null);

  const totalBatches = Math.max(1, Math.ceil(chunks.length / 5));
  const currentBatchNumber = Math.floor(batchStartIndex / 5) + 1;

  const bundledChunks =
    customBundled ||
    chunks.slice(batchStartIndex, batchStartIndex + 5).concat(
      chunks.slice(0, Math.max(0, 5 - (chunks.length - batchStartIndex)))
    ).slice(0, 5);

  const [passageData, setPassageData] = useState<Stage2PassageData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1.2 | 1.0>(1.2);

  // Micro-dictation states
  const [dictationInputs, setDictationInputs] = useState<
    Record<string, string>
  >({});
  const [dictationChecked, setDictationChecked] = useState(false);

  // Generation Effect (Original Sentence Creation) states
  const [selectedChunkForSentence, setSelectedChunkForSentence] =
    useState<ChunkItem | null>(bundledChunks[0] || null);
  const [userSentence, setUserSentence] = useState("");
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState(false);
  const [sentenceFeedback, setSentenceFeedback] =
    useState<SentenceFeedback | null>(null);

  const generatePassage = async (overrideChunks?: ChunkItem[]) => {
    const targetBundle = overrideChunks || bundledChunks;
    setIsGenerating(true);
    setShowFullText(false);
    setDictationChecked(false);
    setDictationInputs({});
    if (targetBundle[0]) {
      setSelectedChunkForSentence(targetBundle[0]);
      setSentenceFeedback(null);
    }
    try {
      const res = await fetch("/api/workout/stage2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_passage",
          chunks: targetBundle,
          specialtyDomains: profile.specialtyDomains,
          apiKey: profile.geminiApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassageData(data);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setBatchStartIndex(0);
    setCustomBundled(null);
    const initialFive = chunks.slice(0, 5);
    generatePassage(initialFive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks]);

  const handleNextBatch = () => {
    setCustomBundled(null);
    const nextIdx = (batchStartIndex + 5) % Math.max(1, chunks.length);
    setBatchStartIndex(nextIdx);
    const nextFive = chunks
      .slice(nextIdx, nextIdx + 5)
      .concat(chunks.slice(0, Math.max(0, 5 - (chunks.length - nextIdx))))
      .slice(0, 5);
    generatePassage(nextFive);
  };

  const handleRandomBundle = () => {
    const shuffled = [...chunks].sort(() => Math.random() - 0.5).slice(0, 5);
    setCustomBundled(shuffled);
    generatePassage(shuffled);
  };

  const handleEvaluateSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChunkForSentence || !userSentence.trim() || isEvaluatingSentence)
      return;
    setIsEvaluatingSentence(true);
    try {
      const res = await fetch("/api/workout/stage2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_sentence",
          chunkText: selectedChunkForSentence.chunkText,
          userSentence: userSentence.trim(),
          apiKey: profile.geminiApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentenceFeedback({
          chunkId: selectedChunkForSentence.id,
          chunkText: selectedChunkForSentence.chunkText,
          userSentence: userSentence.trim(),
          ...data,
        });

        // 自然な短文が作れたら FSRS の安定度 S を更新（S >= 21 日到達で Stage 3 昇格）
        if (data.collocationScore >= 75) {
          const { updatedChunk, log } = scheduleChunkReview(
            selectedChunkForSentence,
            true,
            1500,
            "typing"
          );
          onChunkUpdated(updatedChunk, log);
        }
      }
    } finally {
      setIsEvaluatingSentence(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stage 2 Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              Stage 2: 動的文脈多読 & ゼロから短文生成（リスト全 {chunks.length} 表現対応・5個束ね）
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">
              既知語率98%の200語記事（1.2倍速聴解＋ディクテーション）& 自己参照短文作成
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleNextBatch}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              次の5表現へ (バッチ {currentBatchNumber}/{totalBatches})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRandomBundle}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              ランダム5表現
            </button>
            <button
              type="button"
              onClick={() => generatePassage()}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
              />
              記事再生成
            </button>
          </div>
        </div>

        {/* Bundled 5 Chunks Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">今回の5チャンク:</span>
          {bundledChunks.map((c) => (
            <span
              key={c.id}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200"
            >
              {c.chunkText} ({c.meaningJa})
            </span>
          ))}
        </div>
      </div>

      {/* Part 1: 1.2x Audio Listening & Micro-Dictation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Step 1: 1.2倍速リスニング & リンキング・弱形マイクロディクテーション
            </h3>
            <p className="text-xs text-slate-400">
              最初はテキストを隠して1.2倍速で全体の文脈を掴み、その後リンキング箇所をディクテーションします。
            </p>
          </div>

          {passageData && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  speakEnglishText(passageData.passageText, playbackSpeed)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                記事音声を再生 ({playbackSpeed}x 倍速)
              </button>
              <button
                type="button"
                onClick={() =>
                  setPlaybackSpeed(playbackSpeed === 1.2 ? 1.0 : 1.2)
                }
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
              >
                速度切替: {playbackSpeed}x
              </button>
              <button
                type="button"
                onClick={() => setShowFullText(!showFullText)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                {showFullText ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> スクリプトを隠す
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> 全文スクリプトを表示
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isGenerating || !passageData ? (
          <div className="py-12 text-center text-slate-400">
            5つのチャンクを統合した既知語率98%の200語記事を生成中...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Full Passage (Collapsible) */}
            {showFullText && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-300">
                    {passageData.title}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    既知語率推定: {passageData.knownWordRatioEstimate}%
                  </span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                  {passageData.passageText}
                </p>
                <p className="text-xs leading-relaxed text-slate-400 border-t border-slate-800 pt-3">
                  {passageData.translationJa}
                </p>
              </div>
            )}

            {/* Micro-Dictation Slots */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                音声変化（リンキング・弱形）マイクロ・ディクテーション
              </div>
              <div className="grid grid-cols-1 gap-3">
                {passageData.dictationBlanks.map((blank, index) => {
                  const userVal = dictationInputs[blank.id] || "";
                  const isMatch =
                    userVal.toLowerCase().trim() ===
                    blank.targetPhrase.toLowerCase().trim();
                  return (
                    <div
                      key={blank.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              speakEnglishText(blank.targetPhrase, 1.1)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            部分音声再生
                          </button>
                          <span className="text-xs text-slate-400">
                            {blank.reason}: {blank.phoneticHint}
                          </span>
                        </div>
                        {dictationChecked && (
                          <div className="text-xs font-mono mt-1">
                            正解:{" "}
                            <span className="text-emerald-300 font-bold">
                              {blank.targetPhrase}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={userVal}
                          onChange={(e) =>
                            setDictationInputs({
                              ...dictationInputs,
                              [blank.id]: e.target.value,
                            })
                          }
                          placeholder="聴き取ったチャンクを入力..."
                          className={`w-full sm:w-64 rounded-lg border px-3 py-2 text-sm text-white bg-slate-900 focus:outline-none ${
                            dictationChecked
                              ? isMatch
                                ? "border-emerald-500"
                                : "border-amber-500"
                              : "border-slate-700 focus:border-emerald-400"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDictationChecked(true);
                    setShowFullText(true);
                  }}
                  className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-slate-700 cursor-pointer"
                >
                  ディクテーション答え合わせ & 全文表示
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: Generation Effect (Zero-based Sentence Creation & Collocation Check) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Step 2: 自己文脈でのオリジナル短文作成（Generation Effect）
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ターゲットチャンクを選び、あなた自身の現実の仕事・開発・生活の状況に当てはめた短文を自力で作成してください。AIがコロケーションの自然度を即座に添削します。
          </p>
        </div>

        {/* Select Target Chunk */}
        <div className="flex flex-wrap gap-2">
          {bundledChunks.map((chunk) => (
            <button
              key={chunk.id}
              type="button"
              onClick={() => {
                setSelectedChunkForSentence(chunk);
                setSentenceFeedback(null);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition cursor-pointer ${
                selectedChunkForSentence?.id === chunk.id
                  ? "border-amber-400 bg-amber-500/20 text-white"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              {chunk.chunkText} ({chunk.meaningJa})
            </button>
          ))}
        </div>

        {selectedChunkForSentence && (
          <form onSubmit={handleEvaluateSentence} className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              使用するチャンク:{" "}
              <strong className="text-amber-300 text-sm">
                {selectedChunkForSentence.chunkText}
              </strong>{" "}
              — {selectedChunkForSentence.meaningJa}
            </div>
            <textarea
              rows={3}
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              placeholder={`例: In my current project, we must ${selectedChunkForSentence.chunkText} ...`}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() =>
                  setUserSentence(
                    selectedChunkForSentence.elaboration.selfReference.exampleEn
                  )
                }
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                サンプル自己参照文を入力欄にセット
              </button>
              <button
                type="submit"
                disabled={isEvaluatingSentence || !userSentence.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isEvaluatingSentence
                  ? "コロケーション自然度を添削中..."
                  : "AIコロケーション添削を実行"}
              </button>
            </div>
          </form>
        )}

        {/* AI Feedback Result */}
        {sentenceFeedback && (
          <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-5 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                コロケーション自然度スコア: {sentenceFeedback.collocationScore}{" "}
                / 100
              </span>
              <button
                type="button"
                onClick={() =>
                  speakEnglishText(sentenceFeedback.correctedSentence, 1.0)
                }
                className="text-xs text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> 添削文を音声再生
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-slate-400 text-xs">洗練された修正文:</p>
              <p className="font-bold text-white">
                {sentenceFeedback.correctedSentence}
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {sentenceFeedback.explanationJa}
            </p>
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs">
              <span className="font-semibold text-indigo-300">
                C1/C2 高度化リフレーズ案:{" "}
              </span>
              <span className="text-slate-200">
                {sentenceFeedback.upgradedAlternative}
              </span>
            </div>

            {onPhaseComplete && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onPhaseComplete}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  Phase 3 (AI反駁スプリント) へ進む
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
