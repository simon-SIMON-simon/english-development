"use client";

import React, { useState, useEffect } from "react";
import { ChunkItem, LearningSetId, ReviewLog, UserProfile } from "@/types/sep";
import {
  loadChunks,
  upsertChunk,
  deleteChunkById,
  resetToSeedChunks,
  loadReviewLogs,
  appendReviewLog,
  loadUserProfile,
  saveUserProfile,
  importLearningSet,
  importAllLearningSets,
  DEFAULT_USER_PROFILE,
} from "@/lib/store/sep-store";
import { LEARNING_SETS_METADATA } from "@/lib/data/learning-sets";
import Stage0Elaborator from "@/components/stage0/Stage0Elaborator";
import Stage1Trainer from "@/components/stage1/Stage1Trainer";
import Stage2Trainer from "@/components/stage2/Stage2Trainer";
import Stage3Trainer from "@/components/stage3/Stage3Trainer";
import LearningSetSelector from "@/components/learning-sets/LearningSetSelector";
import {
  Zap,
  Sparkles,
  BookOpen,
  Flame,
  Play,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  RotateCcw,
  BookMarked,
  Layers,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "daily_workout"
  | "learning_sets"
  | "stage0"
  | "stage1"
  | "stage2"
  | "stage3";

export default function SEPAppPage() {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedSetFilter, setSelectedSetFilter] = useState<LearningSetId | "ALL">("ALL");

  // Daily Workout (15-20 min 3-Phase Runner)
  const [workoutPhase, setWorkoutPhase] = useState<1 | 2 | 3>(1);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [domainsInput, setDomainsInput] = useState("");

  useEffect(() => {
    const loadedChunks = loadChunks();
    const loadedLogs = loadReviewLogs();
    const loadedProfile = loadUserProfile();
    setChunks(loadedChunks);
    setLogs(loadedLogs);
    setProfile(loadedProfile);
    setDomainsInput(loadedProfile.specialtyDomains.join("、"));
  }, []);

  // Daily workout timer
  useEffect(() => {
    if (activeTab !== "daily_workout") return;
    const interval = setInterval(() => {
      setWorkoutElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleAddChunk = (newChunk: ChunkItem) => {
    const updated = upsertChunk(newChunk);
    setChunks(updated);
  };

  const handleDeleteChunk = (id: string) => {
    const updated = deleteChunkById(id);
    setChunks(updated);
  };

  const handleChunkUpdated = (updatedChunk: ChunkItem, log: ReviewLog) => {
    const nextChunks = upsertChunk(updatedChunk);
    const nextLogs = appendReviewLog(log);
    setChunks(nextChunks);
    setLogs(nextLogs);
  };

  const handleImportSet = (setId: LearningSetId) => {
    const updated = importLearningSet(setId);
    setChunks(updated);
  };

  const handleImportAllSets = () => {
    const updated = importAllLearningSets();
    setChunks(updated);
  };

  const handleStartWorkoutWithSet = (
    setId: LearningSetId,
    phase: 1 | 2 | 3 = 1
  ) => {
    setSelectedSetFilter(setId);
    setWorkoutPhase(phase);
    setWorkoutElapsedSec(0);
    setActiveTab("daily_workout");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const domains = domainsInput
      .split(/[、,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const nextProfile: UserProfile = {
      ...profile,
      specialtyDomains:
        domains.length > 0 ? domains : DEFAULT_USER_PROFILE.specialtyDomains,
    };
    setProfile(nextProfile);
    saveUserProfile(nextProfile);
    setShowSettings(false);
  };

  const filteredChunks =
    selectedSetFilter === "ALL"
      ? chunks
      : chunks.filter((c) => c.sourceSet === selectedSetFilter);

  // すべての表現がすべてのPhase (Stage 1 / Stage 2 / Stage 3) で利用可能
  const stage1Count = filteredChunks.length;
  const stage2Count = filteredChunks.length;
  const stage3Count = filteredChunks.length;

  const avgLatencyMs =
    filteredChunks.filter((c) => c.bestLatencyMs).length > 0
      ? Math.round(
          filteredChunks
            .filter((c) => c.bestLatencyMs)
            .reduce((acc, c) => acc + (c.bestLatencyMs || 0), 0) /
            filteredChunks.filter((c) => c.bestLatencyMs).length
        )
      : 1780;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 font-black text-white shadow-lg">
              SEP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  SEP — Speed &amp; Elaboration Pipeline
                </h1>
                <span className="hidden sm:inline-block rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  TOEIC 935+ Plateau Breaker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                FSRS記憶安定度 S × 3000ms反応潜時による4ステージ昇格システム
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ダッシュボード
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkoutPhase(1);
                setActiveTab("daily_workout");
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "daily_workout"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md"
                  : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              デイリーワークアウト (15分)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("learning_sets")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "learning_sets"
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20"
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              学習セット (PEL/ACL/AFL/PVPL)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stage0")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "stage0"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stage 0 登録
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stage1")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "stage1"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stage 1 ({stage1Count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stage2")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "stage2"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stage 2 ({stage2Count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stage3")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "stage3"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stage 3 ({stage3Count})
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white cursor-pointer"
              title="プロファイル & AI設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* =============================================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* =============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Hero Call-to-Action: 15-20 min Daily Workout */}
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-300">
                    <Clock className="w-3.5 h-3.5" />
                    1日15〜20分完結 デイリーワークアウト・パイプライン
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    受容語彙を「3000ms以内に引き出せる手続き記憶」へ自動化する
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Phase 1（瞬間検索スプリント 4分）→ Phase 2（既知語率98%記事1.2x聴解＆短文生成
                    6分）→ Phase 3（AI音声反駁 90/60/45秒スプリント 5分）をシームレスに実行します。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutPhase(1);
                      setWorkoutElapsedSec(0);
                      setActiveTab("daily_workout");
                    }}
                    className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-7 py-4 text-base font-extrabold text-white shadow-xl hover:from-indigo-400 hover:to-cyan-400 transition cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    今日のワークアウトを開始
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("stage0")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    新規チャンク登録 (Stage 0)
                  </button>
                </div>
              </div>
            </div>

            {/* Learning Sets (PEL / ACL / AFL / PVPL) Quick Selector */}
            <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <BookMarked className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      4大学術コーパス学習セット（PEL / ACL / AFL / PVPL）
                    </h3>
                    <p className="text-xs text-slate-400">
                      SLA（第二言語習得論）公認の重要句表現・コロケーション・定型句・句動詞セット
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("learning_sets")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 px-4 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-600/50 cursor-pointer"
                >
                  学習セット一覧・インポート詳細へ
                </button>
              </div>

              {/* Set Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">対象セット絞り込み:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSetFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selectedSetFilter === "ALL"
                      ? "bg-white text-slate-950 shadow"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  すべて ({chunks.length})
                </button>
                {(["PEL", "ACL", "AFL", "PVPL"] as LearningSetId[]).map((id) => {
                  const meta = LEARNING_SETS_METADATA[id];
                  const count = chunks.filter((c) => c.sourceSet === id).length;
                  const active = selectedSetFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedSetFilter(id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                        active
                          ? `${meta.badgeColor} ring-1 ring-white/30`
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {id}: {meta.nameJa.replace(/リスト|セット/g, "")} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Stage Pipeline Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab("stage0")}
                className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 hover:border-indigo-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>STAGE 0: 精緻化 &amp; 二重符号化</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {chunks.length}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    総チャンク
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  3〜5語コロケーション変換 ＋ 語源・視覚・{profile.displayName}文脈の統合
                </p>
              </div>

              <div
                onClick={() => setActiveTab("stage1")}
                className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 hover:border-cyan-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>STAGE 1: 高速検索 (S &lt; 7d)</span>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {stage1Count}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    チャンク (平均 {avgLatencyMs}ms)
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  スペル非表示・音声知覚 ＋ 3000ms以内の即答でStage 2へ昇格
                </p>
              </div>

              <div
                onClick={() => setActiveTab("stage2")}
                className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 hover:border-emerald-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>STAGE 2: 文脈多読 (7d ≦ S &lt; 21d)</span>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {stage2Count}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    チャンク
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  5チャンク束ね200語記事（既知語98%・1.2x聴解）＋ 自己文脈短文生成
                </p>
              </div>

              <div
                onClick={() => setActiveTab("stage3")}
                className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-5 hover:border-amber-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>STAGE 3: AI反駁 (S ≧ 21d)</span>
                  <Flame className="w-4 h-4" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">
                  {stage3Count}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    定着チャンク
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  90s→60s→45s 圧縮スプリント ＋ WPM・0.5sポーズ率・高度語彙評価
                </p>
              </div>
            </div>

            {/* Recent Millisecond Latency & FSRS Logs */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    直近の反応潜時（ミリ秒）&amp; FSRS 記憶安定度 S 更新ログ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const reset = resetToSeedChunks();
                    setChunks(reset);
                    setLogs([]);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  初期デモデータにリセット
                </button>
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">
                  まだ今日のトレーニングログがありません。「今日のワークアウトを開始」または各ステージから計測を開始してください。
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">チャンク</th>
                        <th className="py-2 pr-4">入力モード</th>
                        <th className="py-2 pr-4">反応潜時 (RT)</th>
                        <th className="py-2 pr-4">安定度 S 変化</th>
                        <th className="py-2 pr-4">ステージ遷移</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.slice(0, 8).map((log) => (
                        <tr key={log.id} className="text-slate-200">
                          <td className="py-2.5 pr-4 font-bold">
                            {log.chunkText}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-slate-400">
                            {log.inputMode}
                          </td>
                          <td className="py-2.5 pr-4 font-mono">
                            <span
                              className={
                                log.latencyMs <= 3000
                                  ? "text-emerald-400 font-bold"
                                  : "text-amber-400"
                              }
                            >
                              {log.latencyMs} ms
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 font-mono">
                            {log.stabilityBefore}d →{" "}
                            <strong className="text-cyan-300">
                              {log.stabilityAfter}d
                            </strong>
                          </td>
                          <td className="py-2.5 pr-4">
                            Stage {log.stageBefore} →{" "}
                            <strong className="text-white">
                              Stage {log.stageAfter}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB: LEARNING SETS (PEL / ACL / AFL / PVPL) */}
        {/* =============================================================== */}
        {activeTab === "learning_sets" && (
          <LearningSetSelector
            currentChunks={chunks}
            selectedSetFilter={selectedSetFilter}
            onSelectSetFilter={setSelectedSetFilter}
            onImportSet={handleImportSet}
            onImportAllSets={handleImportAllSets}
            onStartWorkoutWithSet={handleStartWorkoutWithSet}
          />
        )}

        {/* =============================================================== */}
        {/* GLOBAL SET SWITCHER FOR ALL PHASES & STAGES */}
        {/* =============================================================== */}
        {(activeTab === "daily_workout" ||
          activeTab === "stage1" ||
          activeTab === "stage2" ||
          activeTab === "stage3") && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                使用学習セット（全表現を全Phaseで使用可能）:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSetFilter("ALL")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  selectedSetFilter === "ALL"
                    ? "bg-white text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                全セット ({chunks.length}表現)
              </button>
              {(["PEL", "ACL", "AFL", "PVPL"] as LearningSetId[]).map((id) => {
                const count = chunks.filter((c) => c.sourceSet === id).length;
                const active = selectedSetFilter === id;
                const meta = LEARNING_SETS_METADATA[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSetFilter(id)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold border transition cursor-pointer ${
                      active
                        ? `${meta.badgeColor} ring-1 ring-white/30`
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {id} ({count}表現)
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-mono text-emerald-300">
              現在対象: {filteredChunks.length} 表現すべて有効
            </span>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: DAILY WORKOUT (Phase 1 -> Phase 2 -> Phase 3 Runner) */}
        {/* =============================================================== */}
        {activeTab === "daily_workout" && (
          <div className="space-y-6">
            {/* Workout Progress Header */}
            <div className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  {
                    phase: 1,
                    title: "Phase 1: 瞬間検索スプリント (4分)",
                    sub: "Stage 1 3000ms計測",
                  },
                  {
                    phase: 2,
                    title: "Phase 2: 記事1.2x聴解 & 短文生成 (6分)",
                    sub: "Stage 2 多読・添削",
                  },
                  {
                    phase: 3,
                    title: "Phase 3: AI反駁スプリント (5分)",
                    sub: "Stage 3 90/60/45s",
                  },
                ].map((item) => (
                  <button
                    key={item.phase}
                    type="button"
                    onClick={() => setWorkoutPhase(item.phase as 1 | 2 | 3)}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition cursor-pointer ${
                      workoutPhase === item.phase
                        ? "border-indigo-400 bg-indigo-500/20 text-white"
                        : workoutPhase > item.phase
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    {workoutPhase > item.phase ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold">
                        {item.phase}
                      </span>
                    )}
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[10px] opacity-75">{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                {selectedSetFilter !== "ALL" && (
                  <span className="text-xs font-bold rounded-lg px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                    対象セット: {selectedSetFilter}
                  </span>
                )}
                <div className="font-mono text-sm text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  経過: {formatTime(workoutElapsedSec)} / 目安 15:00
                </div>
              </div>
            </div>

            {workoutPhase === 1 && (
              <Stage1Trainer
                chunks={filteredChunks}
                onChunkUpdated={handleChunkUpdated}
                onPhaseComplete={() => setWorkoutPhase(2)}
              />
            )}

            {workoutPhase === 2 && (
              <Stage2Trainer
                chunks={filteredChunks}
                profile={profile}
                onChunkUpdated={handleChunkUpdated}
                onPhaseComplete={() => setWorkoutPhase(3)}
              />
            )}

            {workoutPhase === 3 && (
              <Stage3Trainer chunks={filteredChunks} profile={profile} />
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* INDIVIDUAL STAGE TABS */}
        {/* =============================================================== */}
        {activeTab === "stage0" && (
          <Stage0Elaborator
            chunks={chunks}
            profile={profile}
            onAddChunk={handleAddChunk}
            onDeleteChunk={handleDeleteChunk}
          />
        )}

        {activeTab === "stage1" && (
          <Stage1Trainer
            chunks={filteredChunks}
            onChunkUpdated={handleChunkUpdated}
          />
        )}

        {activeTab === "stage2" && (
          <Stage2Trainer
            chunks={filteredChunks}
            profile={profile}
            onChunkUpdated={handleChunkUpdated}
          />
        )}

        {activeTab === "stage3" && (
          <Stage3Trainer chunks={filteredChunks} profile={profile} />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">
              自己参照プロファイル &amp; Gemini API設定
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ユーザー名（自己参照文脈の生成に使用）
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  専門分野・関心領域（読点「、」またはカンマ区切り）
                </label>
                <input
                  type="text"
                  value={domainsInput}
                  onChange={(e) => setDomainsInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stage 3 目標発話速度 (Target WPM)
                </label>
                <input
                  type="number"
                  value={profile.targetWpm}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      targetWpm: Number(e.target.value) || 140,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Gemini API Key（任意: 未設定でも内蔵エンジンで動作します）
                </label>
                <input
                  type="password"
                  value={profile.geminiApiKey || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, geminiApiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
                >
                  設定を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
