"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChunkItem, ReviewLog } from "@/types/sep";
import {
  scheduleChunkReview,
  STAGE1_MAX_LATENCY_MS,
} from "@/lib/fsrs/sep-scheduler";
import { buildPracticalMiniExample } from "@/lib/data/learning-sets";
import {
  speakEnglishText,
  VoiceSessionMonitor,
} from "@/lib/audio/audio-engine";
import {
  Volume2,
  Mic,
  Keyboard,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  EyeOff,
  RotateCcw,
  Shuffle,
} from "lucide-react";

const UK_TO_US_SPELLING: Record<string, string> = {
  favour: "favor",
  favourable: "favorable",
  behaviour: "behavior",
  behavioural: "behavioral",
  analyse: "analyze",
  organisation: "organization",
  organisational: "organizational",
  centre: "center",
  centred: "centered",
  programme: "program",
  catalogue: "catalog",
  defence: "defense",
  offence: "offense",
  licence: "license",
  practise: "practice",
  recognise: "recognize",
  emphasise: "emphasize",
  characterise: "characterize",
  summarise: "summarize",
  optimise: "optimize",
  prioritise: "prioritize",
  standardise: "standardize",
  utilise: "utilize",
};

interface WordDiffItem {
  expected: string;
  actual: string | null;
  matched: boolean;
}

function tokenizeAndNormalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => UK_TO_US_SPELLING[w] || w);
}

/**
 * 厳格なチャンク正誤判定:
 * ターゲットチャンクの全単語が語順・語数ともに完全一致している場合のみ正解(true)とする
 */
function evaluateChunkAccuracy(
  userInput: string,
  targetChunk: string
): {
  isCorrect: boolean;
  wordDiffs: WordDiffItem[];
  extraWords: string[];
} {
  const userWords = tokenizeAndNormalize(userInput);
  const targetWords = tokenizeAndNormalize(targetChunk);

  if (userWords.length === 0 || targetWords.length === 0) {
    return {
      isCorrect: false,
      wordDiffs: targetWords.map((expected) => ({
        expected,
        actual: null,
        matched: false,
      })),
      extraWords: [],
    };
  }

  const wordDiffs: WordDiffItem[] = targetWords.map((expected, idx) => {
    const actual = userWords[idx] ?? null;
    return {
      expected,
      actual,
      matched: actual === expected,
    };
  });

  const extraWords = userWords.slice(targetWords.length);
  const isCorrect =
    userWords.length === targetWords.length &&
    wordDiffs.every((d) => d.matched);

  return {
    isCorrect,
    wordDiffs,
    extraWords,
  };
}

/**
 * チャンクを使った実践的なミニ例文を「前文 + [空欄(ターゲットチャンク)] + 後文」に分割
 */
function getClozeSentenceForChunk(chunk: ChunkItem): {
  before: string;
  target: string;
  after: string;
  fullEn: string;
  fullJa: string;
  wordCount: number;
} {
  let en = chunk.elaboration.selfReference.exampleEn;
  let ja = chunk.elaboration.selfReference.exampleJa;

  const escaped = chunk.chunkText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasQuotedMeta = en.includes(`"${chunk.chunkText}"`);
  const regex = new RegExp(escaped, "i");

  if (hasQuotedMeta || !regex.test(en)) {
    const generated = buildPracticalMiniExample(
      chunk.chunkText,
      chunk.meaningJa
    );
    en = generated.exampleEn;
    ja = generated.exampleJa;
  }

  const match = en.match(regex);
  const wordCount = chunk.chunkText.trim().split(/\s+/).length;

  if (!match || match.index === undefined) {
    const fallback = buildPracticalMiniExample(
      chunk.chunkText,
      chunk.meaningJa
    );
    const fbMatch = fallback.exampleEn.match(regex);
    const idx = fbMatch?.index ?? 0;
    const len = fbMatch ? fbMatch[0].length : chunk.chunkText.length;
    return {
      before: fallback.exampleEn.slice(0, idx),
      target: fallback.exampleEn.slice(idx, idx + len),
      after: fallback.exampleEn.slice(idx + len),
      fullEn: fallback.exampleEn,
      fullJa: fallback.exampleJa,
      wordCount,
    };
  }

  const idx = match.index;
  const len = match[0].length;
  return {
    before: en.slice(0, idx),
    target: en.slice(idx, idx + len),
    after: en.slice(idx + len),
    fullEn: en,
    fullJa: ja,
    wordCount,
  };
}

interface Stage1TrainerProps {
  chunks: ChunkItem[];
  onChunkUpdated: (updated: ChunkItem, log: ReviewLog) => void;
  onPhaseComplete?: () => void;
}

export default function Stage1Trainer({
  chunks,
  onChunkUpdated,
  onPhaseComplete,
}: Stage1TrainerProps) {
  const [scopeMode, setScopeMode] = useState<"all" | "stage1_only">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // デフォルトで選択中のセットの「すべての表現」を使用可能にする
  const baseQueue =
    scopeMode === "stage1_only"
      ? chunks.filter((c) => c.stage === 1).length > 0
        ? chunks.filter((c) => c.stage === 1)
        : chunks
      : chunks;

  const queue = searchQuery.trim()
    ? baseQueue.filter(
        (c) =>
          c.chunkText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.meaningJa.includes(searchQuery)
      )
    : baseQueue;

  const [currentIndex, setCurrentIndex] = useState(0);
  const safeIndex = queue.length > 0 ? currentIndex % queue.length : 0;
  const currentChunk = queue[safeIndex] || chunks[0];

  // Phase 1 内の Step 1 (瞬間聴覚検索) / Step 2 (実践ミニ例文の穴埋め)
  const [subStep, setSubStep] = useState<1 | 2>(1);

  const [inputMode, setInputMode] = useState<"typing" | "voice">("typing");
  const [phaseState, setPhaseState] = useState<
    "ready" | "measuring" | "result"
  >("ready");

  const [typedText, setTypedText] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [capturedLatencyMs, setCapturedLatencyMs] = useState<number | null>(
    null
  );
  const [volumeLevel, setVolumeLevel] = useState(0);

  const [resultInfo, setResultInfo] = useState<{
    isCorrect: boolean;
    latencyMs: number;
    feedbackLabel: string;
    promoted: boolean;
    stabilityBefore: number;
    stabilityAfter: number;
    wordDiffs: WordDiffItem[];
    extraWords: string[];
  } | null>(null);

  // Step 2: 実践ミニ例文の穴埋め用ステート
  const [step2State, setStep2State] = useState<"question" | "result">(
    "question"
  );
  const [step2Text, setStep2Text] = useState("");
  const [step2Result, setStep2Result] = useState<{
    isCorrect: boolean;
    wordDiffs: WordDiffItem[];
    extraWords: string[];
    promoted: boolean;
    stabilityBefore: number;
    stabilityAfter: number;
  } | null>(null);

  const promptStartTimeRef = useRef<number>(0);
  const firstResponseCapturedRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceMonitorRef = useRef<VoiceSessionMonitor | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const step2InputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      voiceMonitorRef.current?.stop();
    };
  }, []);

  const goToStep2 = () => {
    setSubStep(2);
    setStep2State("question");
    setStep2Text("");
    setStep2Result(null);
    setTimeout(() => step2InputRef.current?.focus(), 20);
  };

  // スペースキー & Enterキーによるショートカット
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isTypingField = targetTag === "INPUT" || targetTag === "TEXTAREA";

      if (subStep === 1) {
        if (e.code === "Space" || e.key === " ") {
          if (phaseState === "ready") {
            e.preventDefault();
            startTrial();
          } else if (phaseState === "result" && !isTypingField) {
            e.preventDefault();
            goToStep2();
          }
        } else if (
          e.key === "Enter" &&
          phaseState === "result" &&
          !isTypingField
        ) {
          e.preventDefault();
          goToStep2();
        }
      } else if (subStep === 2) {
        if (
          (e.code === "Space" || e.key === " " || e.key === "Enter") &&
          step2State === "result" &&
          !isTypingField
        ) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [subStep, phaseState, step2State, currentChunk]);

  if (!currentChunk) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-300">チャンクが登録されていません。</p>
      </div>
    );
  }

  // トライアル開始: 音声再生と同時に即座に入力を許可（結果画面まで日本語訳・ヒントは一切非表示）
  const startTrial = async () => {
    setTypedText("");
    setElapsedMs(0);
    setCapturedLatencyMs(null);
    setResultInfo(null);
    firstResponseCapturedRef.current = false;

    const startNow = performance.now();
    promptStartTimeRef.current = startNow;
    setPhaseState("measuring");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (!firstResponseCapturedRef.current) {
        const currentElapsed = Math.round(
          performance.now() - promptStartTimeRef.current
        );
        setElapsedMs(currentElapsed);
      }
    }, 25);

    if (inputMode === "typing") {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      const monitor = new VoiceSessionMonitor({
        onVoiceOnset: (latencyMs) => {
          if (!firstResponseCapturedRef.current) {
            firstResponseCapturedRef.current = true;
            setCapturedLatencyMs(latencyMs);
            setElapsedMs(latencyMs);
          }
        },
        onUpdate: (snap) => {
          setVolumeLevel(snap.volumeLevel);
          if (snap.transcript) {
            setTypedText(snap.transcript);
          }
        },
      });
      voiceMonitorRef.current = monitor;
      monitor.start(startNow);
    }

    // 英語チャンク音声を再生（再生中からそのまま入力可能）
    speakEnglishText(currentChunk.chunkText, 1.0);
  };

  // 最初の打鍵または発話開始のミリ秒（反応潜時 RT）をロック
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      phaseState === "measuring" &&
      !firstResponseCapturedRef.current &&
      e.key.length === 1
    ) {
      const rt = Math.max(
        100,
        Math.round(performance.now() - promptStartTimeRef.current)
      );
      firstResponseCapturedRef.current = true;
      setCapturedLatencyMs(rt);
      setElapsedMs(rt);
    }
  };

  // Step 1 回答判定（正誤判定を行い、Step 2 完了時に最終昇格を確定）
  const submitAnswer = (overrideCorrect?: boolean) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    voiceMonitorRef.current?.stop();

    const finalLatency =
      capturedLatencyMs ??
      Math.round(performance.now() - promptStartTimeRef.current);

    const accuracy = evaluateChunkAccuracy(typedText, currentChunk.chunkText);

    const isCorrect =
      overrideCorrect !== undefined ? overrideCorrect : accuracy.isCorrect;

    const preview = scheduleChunkReview(
      currentChunk,
      isCorrect,
      finalLatency,
      inputMode
    );

    setResultInfo({
      isCorrect,
      latencyMs: finalLatency,
      feedbackLabel: preview.feedbackLabel,
      promoted: isCorrect ? preview.promoted : false,
      stabilityBefore: currentChunk.stability,
      stabilityAfter: preview.updatedChunk.stability,
      wordDiffs: accuracy.wordDiffs,
      extraWords: accuracy.extraWords,
    });
    setPhaseState("result");

    // 結果表示時に正しいチャンク音声を再生して音韻ループを強化
    speakEnglishText(currentChunk.chunkText, 1.0);
  };

  // Step 2: 実践ミニ例文の穴埋め判定
  const submitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const accuracy = evaluateChunkAccuracy(step2Text, currentChunk.chunkText);
    const step1Passed = resultInfo ? resultInfo.isCorrect : true;
    const step1Latency = resultInfo ? resultInfo.latencyMs : 1800;
    const finalCorrect = step1Passed && accuracy.isCorrect;

    const { updatedChunk, log, promoted } = scheduleChunkReview(
      currentChunk,
      finalCorrect,
      step1Latency,
      inputMode
    );

    setStep2Result({
      isCorrect: accuracy.isCorrect,
      wordDiffs: accuracy.wordDiffs,
      extraWords: accuracy.extraWords,
      promoted: finalCorrect ? promoted : false,
      stabilityBefore: currentChunk.stability,
      stabilityAfter: updatedChunk.stability,
    });
    setStep2State("result");
    onChunkUpdated(updatedChunk, log);

    const cloze = getClozeSentenceForChunk(currentChunk);
    speakEnglishText(cloze.fullEn, 1.0);
  };

  const handleNext = () => {
    setSubStep(1);
    setPhaseState("ready");
    setResultInfo(null);
    setTypedText("");
    setStep2State("question");
    setStep2Text("");
    setStep2Result(null);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      onPhaseComplete?.();
    }
  };

  const clozeSentence = getClozeSentenceForChunk(currentChunk);

  const latencyPercent = Math.min(
    100,
    Math.round((elapsedMs / STAGE1_MAX_LATENCY_MS) * 100)
  );
  const isOver3000ms = elapsedMs > STAGE1_MAX_LATENCY_MS;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        {/* Compact Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">
              #{safeIndex + 1} / {queue.length}
            </span>
            {currentChunk.sourceSet && (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {currentChunk.sourceSet}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (queue.length > 1) {
                  const rand = Math.floor(Math.random() * queue.length);
                  setCurrentIndex(rand);
                  setSubStep(1);
                  setPhaseState("ready");
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              ランダム
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Step 1 / Step 2 Switcher */}
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setSubStep(1)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  subStep === 1
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Step 1: 音声検索
              </button>
              <button
                type="button"
                onClick={goToStep2}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  subStep === 2
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Step 2: 例文穴埋め
              </button>
            </div>

            {subStep === 1 && (
              <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode("typing")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    inputMode === "typing"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Keyboard className="w-3 h-3" />
                  タイピング
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("voice")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    inputMode === "voice"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  音声
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: 瞬間音声検索 (3000ms Gate) */}
        {/* ========================================================= */}
        {subStep === 1 && (
          <>
            {/* Phase: READY */}
            {phaseState === "ready" && (
              <div className="py-12 text-center">
                <button
                  type="button"
                  onClick={startTrial}
                  className="inline-flex items-center gap-3 rounded-xl bg-cyan-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-cyan-500 transition cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                  再生して開始
                  <kbd className="rounded bg-slate-950/40 border border-white/20 px-2 py-0.5 text-xs font-mono text-cyan-100">
                    Space
                  </kbd>
                </button>
              </div>
            )}

            {/* Phase: MEASURING */}
            {phaseState === "measuring" && (
              <div className="space-y-5 py-2">
                {/* Slim 3000ms Latency Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">3000ms ゲート</span>
                    <span
                      className={`font-mono text-xl font-extrabold ${
                        capturedLatencyMs !== null
                          ? capturedLatencyMs <= STAGE1_MAX_LATENCY_MS
                            ? "text-emerald-400"
                            : "text-amber-400"
                          : isOver3000ms
                          ? "text-rose-400"
                          : "text-cyan-300"
                      }`}
                    >
                      {elapsedMs} ms
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full transition-all duration-75 ${
                        isOver3000ms
                          ? "bg-rose-500"
                          : elapsedMs > 1800
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${latencyPercent}%` }}
                    />
                  </div>
                </div>

                {inputMode === "typing" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAnswer();
                    }}
                    className="space-y-3"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedText}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setTypedText(e.target.value)}
                      placeholder="英語チャンクを入力して Enter"
                      className="w-full rounded-xl border-2 border-cyan-500/60 bg-slate-950 px-5 py-4 text-lg font-bold text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          speakEnglishText(currentChunk.chunkText, 1.0);
                          inputRef.current?.focus();
                        }}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" /> もう一度聴く
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-500 cursor-pointer"
                      >
                        確定 (Enter)
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-4">
                    <div className="mx-auto max-w-xs h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-75"
                        style={{ width: `${volumeLevel}%` }}
                      />
                    </div>
                    <p className="text-base font-mono text-emerald-300 min-h-[1.5rem]">
                      {typedText || "発話待機中..."}
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => submitAnswer(true)}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500 cursor-pointer"
                      >
                        判定へ進む
                      </button>
                      <button
                        type="button"
                        onClick={() => submitAnswer(false)}
                        className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        パス
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase: RESULT */}
            {phaseState === "result" && resultInfo && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Status Header */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                    resultInfo.isCorrect &&
                    resultInfo.latencyMs <= STAGE1_MAX_LATENCY_MS
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : resultInfo.isCorrect
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-rose-500/50 bg-rose-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {resultInfo.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-white">
                      {resultInfo.isCorrect
                        ? resultInfo.latencyMs <= STAGE1_MAX_LATENCY_MS
                          ? `正解 (${resultInfo.latencyMs}ms)`
                          : `正解・時間超過 (${resultInfo.latencyMs}ms — 昇格なし)`
                        : "不正解（昇格なし）"}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    Step 2 クリアで記録確定
                  </span>
                </div>

                {/* Input vs Correct Chunk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="text-[11px] text-slate-400">あなたの入力</div>
                    <div
                      className={`mt-1 text-lg font-bold font-mono break-words ${
                        resultInfo.isCorrect
                          ? "text-emerald-300"
                          : "text-rose-400"
                      }`}
                    >
                      {typedText.trim() || "（未入力）"}
                    </div>

                    {!resultInfo.isCorrect &&
                      resultInfo.wordDiffs.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {resultInfo.wordDiffs.map((diff, i) => (
                            <span
                              key={i}
                              className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${
                                diff.matched
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {diff.matched
                                ? diff.expected
                                : `${diff.actual ?? "—"} → ${diff.expected}`}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-slate-400">正解チャンク</div>
                      <div className="mt-1 text-xl font-extrabold text-white">
                        {currentChunk.chunkText}
                      </div>
                      <div className="mt-1 text-sm font-bold text-amber-300">
                        {currentChunk.meaningJa}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        speakEnglishText(currentChunk.chunkText, 1.0)
                      }
                      className="rounded-full bg-slate-800 p-2.5 text-slate-200 hover:bg-slate-700 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Concise Explanation */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
                  <p className="text-slate-200 leading-relaxed">
                    {currentChunk.elaboration.etymology.nuance}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startTrial}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    もう一度
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    Step 2: ミニ例文穴埋めへ
                    <kbd className="rounded bg-slate-950/40 px-1.5 py-0.5 text-[10px] font-mono">
                      Space
                    </kbd>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 実践ミニ例文の穴埋め (Mini Cloze in Context) */}
        {/* ========================================================= */}
        {subStep === 2 && (
          <div className="space-y-5">
            {/* Cloze Prompt Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-300">
                  {clozeSentence.fullJa}
                </span>
                <button
                  type="button"
                  onClick={() => speakEnglishText(clozeSentence.fullEn, 1.0)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  全文音声
                </button>
              </div>

              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                <span>{clozeSentence.before}</span>
                {step2State === "question" ? (
                  <span className="mx-1 inline-block rounded-lg border border-dashed border-indigo-400/60 bg-indigo-500/10 px-3 py-0.5 font-mono text-sm font-bold text-indigo-300">
                    {"____ ".repeat(clozeSentence.wordCount).trim()} (
                    {clozeSentence.wordCount}語)
                  </span>
                ) : (
                  <span
                    className={`mx-1 inline-block rounded-lg px-2.5 py-0.5 font-bold ${
                      step2Result?.isCorrect
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {clozeSentence.target}
                  </span>
                )}
                <span>{clozeSentence.after}</span>
              </div>
            </div>

            {step2State === "question" ? (
              <form onSubmit={submitStep2} className="space-y-3">
                <input
                  ref={step2InputRef}
                  type="text"
                  value={step2Text}
                  onChange={(e) => setStep2Text(e.target.value)}
                  placeholder={`空欄に入るチャンク（${currentChunk.meaningJa}）を入力して Enter`}
                  className="w-full rounded-xl border-2 border-indigo-500/60 bg-slate-950 px-5 py-4 text-lg font-bold text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    確定 (Enter)
                  </button>
                </div>
              </form>
            ) : (
              step2Result && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                      step2Result.isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-rose-500/50 bg-rose-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step2Result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-white">
                        {step2Result.isCorrect
                          ? "正解 — 文脈内チャンク運用クリア"
                          : "不正解（昇格なし）"}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      S: {step2Result.stabilityBefore}d →{" "}
                      <strong className="text-white">
                        {step2Result.stabilityAfter}d
                      </strong>
                      {step2Result.promoted && (
                        <span className="ml-2 text-emerald-300 font-bold">
                          🎉 Stage 2 昇格
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Diff on wrong input */}
                  {!step2Result.isCorrect && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                      <div className="text-xs text-slate-400">
                        あなたの入力:{" "}
                        <span className="font-mono font-bold text-rose-400">
                          {step2Text.trim() || "（未入力）"}
                        </span>{" "}
                        / 正解:{" "}
                        <span className="font-mono font-bold text-emerald-300">
                          {currentChunk.chunkText}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {step2Result.wordDiffs.map((diff, i) => (
                          <span
                            key={i}
                            className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${
                              diff.matched
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {diff.matched
                              ? diff.expected
                              : `${diff.actual ?? "—"} → ${diff.expected}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={goToStep2}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      もう一度
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
                    >
                      次のチャンクへ
                      <kbd className="rounded bg-slate-950/40 px-1.5 py-0.5 text-[10px] font-mono">
                        Space
                      </kbd>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
