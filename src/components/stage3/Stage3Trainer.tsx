"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChunkItem,
  SprintRoundResult,
  Stage3EvaluationResult,
  UserProfile,
} from "@/types/sep";
import {
  speakEnglishText,
  VoiceSessionMonitor,
} from "@/lib/audio/audio-engine";
import {
  Flame,
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  AlertCircle,
  Gauge,
  PauseCircle,
  Award,
  RefreshCw,
  Shuffle,
  ArrowRight,
} from "lucide-react";

interface Stage3TrainerProps {
  chunks: ChunkItem[];
  profile: UserProfile;
}

const SPRINT_TIME_LIMITS: (90 | 60 | 45)[] = [90, 60, 45];

export default function Stage3Trainer({ chunks, profile }: Stage3TrainerProps) {
  // リスト内のすべての表現を3個単位またはランダムに強制使用チャンクとして選択可能にする
  const [batchStartIdx, setBatchStartIdx] = useState(0);
  const [customThree, setCustomThree] = useState<string[] | null>(null);

  const totalBatches = Math.max(1, Math.ceil(chunks.length / 3));
  const currentBatchNum = Math.floor(batchStartIdx / 3) + 1;

  const requiredChunks =
    customThree ||
    chunks
      .slice(batchStartIdx, batchStartIdx + 3)
      .concat(chunks.slice(0, Math.max(0, 3 - (chunks.length - batchStartIdx))))
      .slice(0, 3)
      .map((c) => c.chunkText);

  const [counterData, setCounterData] = useState<{
    topic: string;
    aiCounterArgument: string;
    aiCounterJa: string;
    hintStrategyJa: string;
  } | null>(null);

  const [currentRoundIdx, setCurrentRoundIdx] = useState<0 | 1 | 2>(0);
  const currentLimitSec = SPRINT_TIME_LIMITS[currentRoundIdx];

  const [isRecording, setIsRecording] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(90);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveWpm, setLiveWpm] = useState(0);
  const [livePauseCount, setLivePauseCount] = useState(0);
  const [livePauseMs, setLivePauseMs] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const [completedRounds, setCompletedRounds] = useState<SprintRoundResult[]>(
    []
  );
  const [evaluation, setEvaluation] = useState<Stage3EvaluationResult | null>(
    null
  );
  const [isEvaluating, setIsEvaluating] = useState(false);

  const monitorRef = useRef<VoiceSessionMonitor | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartRef = useRef<number>(0);

  const fetchCounterArgument = async (overrideRequired?: string[]) => {
    const targets = overrideRequired || requiredChunks;
    setCompletedRounds([]);
    setEvaluation(null);
    setCurrentRoundIdx(0);
    setRemainingSec(90);
    setLiveTranscript("");

    const res = await fetch("/api/workout/stage3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_counter",
        requiredChunks: targets,
        specialtyDomains: profile.specialtyDomains,
        apiKey: profile.geminiApiKey,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCounterData(data);
    }
  };

  useEffect(() => {
    setBatchStartIdx(0);
    setCustomThree(null);
    const firstThree = chunks.slice(0, 3).map((c) => c.chunkText);
    fetchCounterArgument(firstThree);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      monitorRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks]);

  const handleNextThreeChunks = () => {
    setCustomThree(null);
    const nextIdx = (batchStartIdx + 3) % Math.max(1, chunks.length);
    setBatchStartIdx(nextIdx);
    const nextThree = chunks
      .slice(nextIdx, nextIdx + 3)
      .concat(chunks.slice(0, Math.max(0, 3 - (chunks.length - nextIdx))))
      .slice(0, 3)
      .map((c) => c.chunkText);
    fetchCounterArgument(nextThree);
  };

  const handleRandomThreeChunks = () => {
    const picked = [...chunks]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.chunkText);
    setCustomThree(picked);
    fetchCounterArgument(picked);
  };

  // チャンク使用有無判定ヘルパー
  const checkChunkUsed = (text: string, chunkText: string): boolean => {
    const normText = text.toLowerCase();
    const keywords = chunkText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (keywords.length === 0) return normText.includes(chunkText.toLowerCase());
    return keywords.every((kw) => normText.includes(kw.slice(0, 4)));
  };

  const startSprintRound = async () => {
    setLiveTranscript("");
    setLiveWpm(0);
    setLivePauseCount(0);
    setLivePauseMs(0);
    setRemainingSec(currentLimitSec);
    setIsRecording(true);
    roundStartRef.current = performance.now();

    const monitor = new VoiceSessionMonitor({
      onUpdate: (snap) => {
        setVolumeLevel(snap.volumeLevel);
        if (snap.transcript) {
          setLiveTranscript(snap.transcript);
        }
        setLiveWpm(snap.wpm);
        setLivePauseCount(snap.pauseCountOver500ms);
        setLivePauseMs(snap.totalPauseDurationMs);
      },
    });
    monitorRef.current = monitor;
    await monitor.start(roundStartRef.current);

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const elapsedSec = Math.floor(
        (performance.now() - roundStartRef.current) / 1000
      );
      const left = Math.max(0, currentLimitSec - elapsedSec);
      setRemainingSec(left);
      if (left <= 0) {
        finishSprintRound();
      }
    }, 250);
  };

  const finishSprintRound = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const snap = monitorRef.current?.stop();
    setIsRecording(false);

    const finalTranscript = (liveTranscript || snap?.transcript || "").trim();
    const durationSec = Math.max(
      5,
      Math.min(
        currentLimitSec,
        Math.round((performance.now() - roundStartRef.current) / 1000)
      )
    );
    const words = finalTranscript
      ? finalTranscript.split(/\s+/).filter(Boolean).length
      : 0;
    const calculatedWpm = Math.round(words / (durationSec / 60));
    const pauseMs = snap?.totalPauseDurationMs ?? livePauseMs;
    const pauseRatioPercent = Number(
      Math.min(100, (pauseMs / (durationSec * 1000)) * 100).toFixed(1)
    );

    const usedChunks = requiredChunks.filter((c) =>
      checkChunkUsed(finalTranscript, c)
    );
    const missingChunks = requiredChunks.filter(
      (c) => !checkChunkUsed(finalTranscript, c)
    );

    const roundResult: SprintRoundResult = {
      roundNumber: (currentRoundIdx + 1) as 1 | 2 | 3,
      timeLimitSec: currentLimitSec,
      durationSec,
      transcript:
        finalTranscript || "(音声入力またはテキストで反駁を入力してください)",
      wordCount: words,
      wpm: calculatedWpm,
      pauseCountOver500ms: snap?.pauseCountOver500ms ?? livePauseCount,
      totalPauseDurationMs: pauseMs,
      pauseRatioPercent,
      usedChunks,
      missingChunks,
    };

    const updatedRounds = [...completedRounds, roundResult];
    setCompletedRounds(updatedRounds);

    if (currentRoundIdx < 2) {
      const nextIdx = (currentRoundIdx + 1) as 0 | 1 | 2;
      setCurrentRoundIdx(nextIdx);
      setRemainingSec(SPRINT_TIME_LIMITS[nextIdx]);
    } else {
      evaluateAllRounds(updatedRounds);
    }
  };

  const evaluateAllRounds = async (roundsToEval: SprintRoundResult[]) => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/workout/stage3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_sprint",
          requiredChunks,
          aiCounterArgument: counterData?.aiCounterArgument,
          rounds: roundsToEval,
          apiKey: profile.geminiApiKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stage 3 Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5" />
              Stage 3: AI音声反駁（カウンター）& 90s → 60s → 45s 圧縮スプリント（全 {chunks.length} 表現対応）
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">
              指定チャンクを強制使用し、制限時間を圧縮しながら流暢性と語彙高度化を極める
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleNextThreeChunks}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              次の3表現へ ({currentBatchNum}/{totalBatches})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRandomThreeChunks}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              ランダム3表現
            </button>
            <button
              type="button"
              onClick={() => fetchCounterArgument()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              反駁テーマ再生成
            </button>
          </div>
        </div>
      </div>

      {/* AI Counter-Argument Box */}
      {counterData && (
        <div className="rounded-2xl border border-rose-500/30 bg-slate-900/95 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                AI Counter-Argument ({counterData.topic})
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                AIからの鋭い反論・挑発に対して即座に言い返してください
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                speakEnglishText(counterData.aiCounterArgument, 1.05)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              AIの反論を音声で聴く
            </button>
          </div>

          <blockquote className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            &ldquo;{counterData.aiCounterArgument}&rdquo;
            <div className="mt-2 text-xs text-slate-400">
              {counterData.aiCounterJa}
            </div>
          </blockquote>

          {/* Mandatory Chunks Checklist */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-amber-300">
              【強制使用チャンク】発話内で以下のチャンクを使うとリアルタイムで点灯します:
            </div>
            <div className="flex flex-wrap gap-2.5">
              {requiredChunks.map((chunkStr) => {
                const used = checkChunkUsed(liveTranscript, chunkStr);
                return (
                  <div
                    key={chunkStr}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      used
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        : "border-slate-700 bg-slate-950 text-slate-300"
                    }`}
                  >
                    {used ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                    )}
                    {chunkStr}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compression Sprint Controller (90s -> 60s -> 45s) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 space-y-6">
        {/* Round Tabs */}
        <div className="grid grid-cols-3 gap-3">
          {SPRINT_TIME_LIMITS.map((sec, idx) => {
            const done = completedRounds.some((r) => r.roundNumber === idx + 1);
            const active = currentRoundIdx === idx;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  if (!isRecording) {
                    setCurrentRoundIdx(idx as 0 | 1 | 2);
                    setRemainingSec(sec);
                  }
                }}
                className={`rounded-xl border p-3 text-center transition cursor-pointer ${
                  active
                    ? "border-amber-400 bg-amber-500/20 text-white"
                    : done
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                <div className="text-xs font-semibold">Round {idx + 1}</div>
                <div className="text-lg font-extrabold font-mono">{sec}秒</div>
                <div className="text-[11px] opacity-80">
                  {idx === 0
                    ? "論理構築 & チャンク網羅"
                    : idx === 1
                    ? "言い淀み削減・圧縮"
                    : "45秒 極限自動化スプリント"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Bar (Countdown, WPM, >=0.5s Pause Detector) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            <div className="text-xs text-slate-400">残り制限時間</div>
            <div className="mt-1 font-mono text-3xl font-extrabold text-amber-400">
              {remainingSec}s
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              発話速度 (WPM)
            </div>
            <div className="mt-1 font-mono text-3xl font-extrabold text-cyan-300">
              {liveWpm}{" "}
              <span className="text-xs font-normal text-slate-500">
                / 目標 {profile.targetWpm}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
              <PauseCircle className="w-3.5 h-3.5 text-rose-400" />
              0.5秒以上のポーズ検知
            </div>
            <div className="mt-1 font-mono text-3xl font-extrabold text-rose-300">
              {livePauseCount}回{" "}
              <span className="text-xs font-normal text-slate-500">
                ({(livePauseMs / 1000).toFixed(1)}s)
              </span>
            </div>
          </div>
        </div>

        {/* Speech Input / Transcript Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              発話トランスクリプト（マイク音声認識 または 直接編集・入力も可能）:
            </label>
            {isRecording && (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                録音 & 0.5秒ポーズ監視中 (音量レベル: {volumeLevel}%)
              </div>
            )}
          </div>

          <textarea
            rows={4}
            value={liveTranscript}
            onChange={(e) => {
              const val = e.target.value;
              setLiveTranscript(val);
              const words = val.trim().split(/\s+/).filter(Boolean).length;
              const elapsedMin = Math.max(
                0.2,
                (currentLimitSec - remainingSec || 15) / 60
              );
              setLiveWpm(Math.round(words / elapsedMin));
            }}
            placeholder={`指定チャンク (${requiredChunks.join(", ")}) を使ってAIの反論に言い返してください...`}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const sample = `While shipping fast prototypes is tempting, doing so ${requiredChunks[0] || "at the expense of"} clean architecture is risky. Quick hacks quickly ${requiredChunks[2] || "reach a point of diminishing returns"} as the product scales. Therefore, solid engineering must ${requiredChunks[1] || "remain a viable option for"} our team.`;
                setLiveTranscript(sample);
                setLiveWpm(148);
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              模範反駁ドラフトをセットしてテスト
            </button>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startSprintRound}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  Round {currentRoundIdx + 1} ({currentLimitSec}秒) スプリント開始
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishSprintRound}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-500 cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  発話終了 & ラウンド記録
                </button>
              )}

              {liveTranscript.trim() && !isRecording && (
                <button
                  type="button"
                  onClick={finishSprintRound}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                >
                  この内容でRound {currentRoundIdx + 1}を確定 & AI評価
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Completed Rounds Comparison Table */}
        {completedRounds.length > 0 && (
          <div className="space-y-3 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                圧縮スプリント計測ログ（90秒 → 60秒 → 45秒）
              </h4>
              <button
                type="button"
                onClick={() => evaluateAllRounds(completedRounds)}
                disabled={isEvaluating}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
              >
                {isEvaluating
                  ? "語彙高度化スコア算出中..."
                  : "現時点のラウンドでAI語彙高度化評価を実行"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {completedRounds.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs"
                >
                  <div className="flex justify-between font-bold text-amber-300">
                    <span>
                      Round {r.roundNumber} ({r.timeLimitSec}s)
                    </span>
                    <span className="font-mono text-cyan-300">{r.wpm} WPM</span>
                  </div>
                  <div className="text-slate-400">
                    ポーズ率:{" "}
                    <strong className="text-white">
                      {r.pauseRatioPercent}%
                    </strong>{" "}
                    (0.5s以上ポーズ: {r.pauseCountOver500ms}回)
                  </div>
                  <div className="text-slate-400">
                    指定チャンク達成:{" "}
                    <strong className="text-emerald-300">
                      {r.usedChunks.length} / {requiredChunks.length}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lexical Sophistication & CAF Evaluation Card */}
      {evaluation && (
        <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-300">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  CAF Hypothesis & Lexical Sophistication Assessment
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  語彙高度化スコア: {evaluation.lexicalSophisticationScore} / 100
                </h3>
              </div>
            </div>

            <div className="flex gap-4 text-center font-mono text-xs">
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <div className="text-slate-400">Complexity</div>
                <div className="text-base font-bold text-indigo-300">
                  {evaluation.cafScores.complexity}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <div className="text-slate-400">Accuracy</div>
                <div className="text-base font-bold text-emerald-300">
                  {evaluation.cafScores.accuracy}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <div className="text-slate-400">Fluency</div>
                <div className="text-base font-bold text-cyan-300">
                  {evaluation.cafScores.fluency}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {evaluation.overallCritiqueJa}
          </p>

          {/* Basic Word Escape Detection */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              安全な基礎語彙への「逃げ」検出 & 高度語彙へのリフレーズ指導
            </div>
            {evaluation.basicWordEscapes.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1 text-xs"
              >
                <div className="font-bold text-white">
                  検出: <span className="text-rose-300">{item.usedBasicExpression}</span>{" "}
                  → 推奨昇格チャンク:{" "}
                  <span className="text-emerald-300">
                    {item.sophisticatedReplacement}
                  </span>
                </div>
                <p className="text-slate-400">{item.reasonJa}</p>
              </div>
            ))}
          </div>

          {/* Model Counter Response */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">
                C2レベル模範カウンター回答（45秒スプリント用シャドーイング素材）
              </span>
              <button
                type="button"
                onClick={() =>
                  speakEnglishText(evaluation.modelCounterResponseEn, 1.05)
                }
                className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:underline cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> 模範音声を再生
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {evaluation.modelCounterResponseEn}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
