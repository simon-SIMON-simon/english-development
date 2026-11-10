"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChunkItem, ReviewLog } from "@/types/sep";
import {
  scheduleChunkReview,
  STAGE1_MAX_LATENCY_MS,
} from "@/lib/fsrs/sep-scheduler";
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
  ArrowRight,
  EyeOff,
  RotateCcw,
} from "lucide-react";

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
  // Stage 1 優先、なければ全チャンクから選択
  const queue = chunks.filter((c) => c.stage === 1).length > 0
    ? chunks.filter((c) => c.stage === 1)
    : chunks.slice(0, 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentChunk = queue[currentIndex] || queue[0];

  const [inputMode, setInputMode] = useState<"typing" | "voice">("typing");
  const [phaseState, setPhaseState] = useState<
    "ready" | "listening_prompt" | "measuring" | "result"
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
    stabilityAfter: number;
  } | null>(null);

  const promptStartTimeRef = useRef<number>(0);
  const firstResponseCapturedRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceMonitorRef = useRef<VoiceSessionMonitor | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      voiceMonitorRef.current?.stop();
    };
  }, []);

  // スペースキーによる開始 & 次のチャンク遷移ショートカット
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isTypingField = targetTag === "INPUT" || targetTag === "TEXTAREA";

      if (e.code === "Space" || e.key === " ") {
        if (phaseState === "ready") {
          e.preventDefault();
          startTrial();
        } else if (phaseState === "result" && !isTypingField) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === "Enter" && phaseState === "result" && !isTypingField) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [phaseState, currentChunk]);

  if (!currentChunk) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-300">チャンクが登録されていません。</p>
      </div>
    );
  }

  // トライアル開始: 視覚テキストを隠したまま音声プライミング → 日本語概念提示と同時にミリ秒計測開始
  const startTrial = async () => {
    setTypedText("");
    setElapsedMs(0);
    setCapturedLatencyMs(null);
    setResultInfo(null);
    firstResponseCapturedRef.current = false;
    setPhaseState("listening_prompt");

    // まずスペルを隠した状態で自然な連続音声を知覚させる
    await speakEnglishText(currentChunk.chunkText, 1.0);

    // 音声完了の瞬間に日本語トリガーを表示し、ミリ秒タイマー開始
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
      await monitor.start(startNow);
    }
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

  // 回答判定
  const submitAnswer = (overrideCorrect?: boolean) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    voiceMonitorRef.current?.stop();

    const finalLatency =
      capturedLatencyMs ??
      Math.round(performance.now() - promptStartTimeRef.current);

    const normalizedUser = typedText
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim();
    const normalizedTarget = currentChunk.chunkText
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim();

    // 主要語が一致していれば正解と判定
    const targetWords = normalizedTarget.split(/\s+/);
    const matchedWords = targetWords.filter((w) =>
      normalizedUser.includes(w)
    );
    const autoCorrect =
      normalizedUser === normalizedTarget ||
      matchedWords.length >= Math.max(2, targetWords.length - 1);

    const isCorrect =
      overrideCorrect !== undefined ? overrideCorrect : autoCorrect;

    const { updatedChunk, log, promoted, feedbackLabel } = scheduleChunkReview(
      currentChunk,
      isCorrect,
      finalLatency,
      inputMode
    );

    setResultInfo({
      isCorrect,
      latencyMs: finalLatency,
      feedbackLabel,
      promoted,
      stabilityAfter: updatedChunk.stability,
    });
    setPhaseState("result");
    onChunkUpdated(updatedChunk, log);

    // 結果表示時に正しいチャンク音声を再生して音韻ループを強化
    speakEnglishText(currentChunk.chunkText, 1.0);
  };

  const handleNext = () => {
    setPhaseState("ready");
    setResultInfo(null);
    setTypedText("");
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      onPhaseComplete?.();
    }
  };

  const latencyPercent = Math.min(
    100,
    Math.round((elapsedMs / STAGE1_MAX_LATENCY_MS) * 100)
  );
  const isOver3000ms = elapsedMs > STAGE1_MAX_LATENCY_MS;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
              <Zap className="w-3.5 h-3.5" />
              Stage 1: 音声優先・高速検索トレーナー（3000ms 反応潜時ゲート）
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">
              スペルを隠し、音と概念から3秒（3000ms）以内にチャンクを引き出す
            </h2>
          </div>

          {/* Input Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode("typing")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                inputMode === "typing"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              タイピング (打鍵潜時計測)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                inputMode === "voice"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              音声発話 (Web Audio VAD計測)
            </button>
          </div>
        </div>
      </div>

      {/* Main Arena Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
          <span>
            カード {currentIndex + 1} / {queue.length}
          </span>
          <span className="font-mono">
            現在の記憶安定度 S ={" "}
            <strong className="text-white">{currentChunk.stability}日</strong>{" "}
            (Stage 2昇格条件: S ≥ 7.0日)
          </span>
        </div>

        {/* Phase: READY */}
        {phaseState === "ready" && (
          <div className="py-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <EyeOff className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                視覚（スペル）非表示モード
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                開始ボタンを押すと英語チャンクの音声が流れ、直後に日本語の概念が表示されます。
                表示から<strong>3000ms以内</strong>に最初の1文字を打鍵（または第一声を発話）してください。
              </p>
            </div>
            <button
              type="button"
              onClick={startTrial}
              className="inline-flex items-center gap-2.5 rounded-xl bg-cyan-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-cyan-500 transition cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              音声知覚 & 3000ms検索を開始する
              <span className="rounded-lg bg-slate-950/40 border border-white/20 px-2.5 py-1 text-xs font-mono font-medium text-cyan-200">
                Space
              </span>
            </button>
            <div className="text-xs text-slate-500 font-mono">
              キーボードの <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Space</kbd> キーでも直接開始できます
            </div>
          </div>
        )}

        {/* Phase: LISTENING PROMPT */}
        {phaseState === "listening_prompt" && (
          <div className="py-14 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 animate-pulse">
              <Volume2 className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-indigo-300">
              連続音声を聴き取っています...（スペル非表示）
            </p>
          </div>
        )}

        {/* Phase: MEASURING (3000ms Countdown & Latency Capture) */}
        {phaseState === "measuring" && (
          <div className="space-y-6">
            {/* 3000ms Latency Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">
                  反応潜時（Reaction Latency）:
                </span>
                <span
                  className={`font-mono text-2xl font-extrabold ${
                    capturedLatencyMs !== null
                      ? capturedLatencyMs <= STAGE1_MAX_LATENCY_MS
                        ? "text-emerald-400"
                        : "text-amber-400"
                      : isOver3000ms
                      ? "text-rose-400"
                      : "text-cyan-300"
                  }`}
                >
                  {elapsedMs} ms{" "}
                  {capturedLatencyMs !== null && " (反応潜時ロック完了!)"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
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
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0ms</span>
                <span>⚡ 1800ms (Instant)</span>
                <span>🎯 3000ms (昇格上限ライン)</span>
              </div>
            </div>

            {/* Concept Prompt */}
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                日本語概念トリガー（英語3〜5語チャンクを即答）
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-300">
                {currentChunk.meaningJa}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                文脈ヒント: {currentChunk.elaboration.selfReference.exampleJa}
              </div>
            </div>

            {/* Input Field or Voice Meter */}
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
                  placeholder="聞き取った英語チャンクをタイプして Enter..."
                  className="w-full rounded-xl border-2 border-cyan-500/60 bg-slate-950 px-5 py-4 text-lg font-bold text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => speakEnglishText(currentChunk.chunkText, 1.0)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> 音声をもう一度聴く
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 cursor-pointer"
                  >
                    回答を確定 (Enter)
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-cyan-500/40 bg-slate-950 p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Mic className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white">
                    マイクに向かって英語チャンクを即座に発話してください
                  </span>
                </div>
                {/* Voice Volume Bar */}
                <div className="mx-auto max-w-xs h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${volumeLevel}%` }}
                  />
                </div>
                <p className="text-base font-mono text-emerald-300 min-h-[1.5rem]">
                  {typedText || "（音声認識待機中...）"}
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => submitAnswer(true)}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    発話完了（正解として記録）
                  </button>
                  <button
                    type="button"
                    onClick={() => submitAnswer(false)}
                    className="rounded-xl bg-rose-600/80 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-500 cursor-pointer"
                  >
                    言えなかった（再検索）
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase: RESULT */}
        {phaseState === "result" && resultInfo && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div
              className={`rounded-xl border p-5 ${
                resultInfo.isCorrect &&
                resultInfo.latencyMs <= STAGE1_MAX_LATENCY_MS
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : resultInfo.isCorrect
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-rose-500/50 bg-rose-500/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {resultInfo.isCorrect &&
                  resultInfo.latencyMs <= STAGE1_MAX_LATENCY_MS ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                  <span className="text-base font-bold text-white">
                    {resultInfo.feedbackLabel}
                  </span>
                </div>
                <span className="font-mono text-sm text-slate-300">
                  安定度 S →{" "}
                  <strong className="text-white">
                    {resultInfo.stabilityAfter}日
                  </strong>
                </span>
              </div>

              {resultInfo.promoted && (
                <div className="mt-3 rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-200">
                  🎉 記憶安定度 S が 7日を超えたため、このチャンクは【Stage 2:
                  動的文脈多読 & 短文生成】へ昇格しました！
                </div>
              )}
            </div>

            {/* Revealed Chunk & Phonetics */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">正解チャンク</div>
                  <div className="text-2xl font-extrabold text-white mt-0.5">
                    {currentChunk.chunkText}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglishText(currentChunk.chunkText, 1.0)}
                  className="rounded-full bg-indigo-500/20 p-3 text-indigo-300 hover:bg-indigo-500/30 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs font-mono text-cyan-300">
                {currentChunk.elaboration.phonetics.ipa} —{" "}
                {currentChunk.elaboration.phonetics.linkingAndWeakForms}
              </div>
              <div className="text-sm text-slate-300 border-t border-slate-800 pt-2">
                {currentChunk.elaboration.selfReference.exampleEn}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={startTrial}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                もう一度計測する
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 cursor-pointer"
              >
                次のチャンクへ
                <span className="rounded-md bg-slate-950/40 border border-white/20 px-2 py-0.5 text-[10px] font-mono text-cyan-200">
                  Space
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
