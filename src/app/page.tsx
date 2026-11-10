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
  | "daily_workout"
  | "learning_sets"
  | "stage0"
  | "dashboard";

export default function SEPAppPage() {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [activeTab, setActiveTab] = useState<ActiveTab>("daily_workout");
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
      {/* Minimal Single-Line Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand + Phase Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("daily_workout")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-black text-white cursor-pointer"
            >
              SEP
            </button>

            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              {[
                { phase: 1, label: "Phase 1: 瞬間検索" },
                { phase: 2, label: "Phase 2: 多読・短文" },
                { phase: 3, label: "Phase 3: AI反駁" },
              ].map((item) => (
                <button
                  key={item.phase}
                  type="button"
                  onClick={() => {
                    setWorkoutPhase(item.phase as 1 | 2 | 3);
                    setActiveTab("daily_workout");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    activeTab === "daily_workout" && workoutPhase === item.phase
                      ? "bg-cyan-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Compact Set Filter & Secondary Views */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Compact Set Selector */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              {(["ALL", "PEL", "ACL", "AFL", "PVPL"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedSetFilter(id)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                    selectedSetFilter === id
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("learning_sets")}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "learning_sets"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              セット一覧
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stage0")}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "stage0"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ＋追加
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ログ
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
              title="設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* =============================================================== */}
        {/* MAIN VIEW: WORKOUT (Phase 1 / Phase 2 / Phase 3) */}
        {/* =============================================================== */}
        {activeTab === "daily_workout" && (
          <div>
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
        {/* TAB: LEARNING SETS */}
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
        {/* TAB: STAGE 0 (Add Chunk) */}
        {/* =============================================================== */}
        {activeTab === "stage0" && (
          <Stage0Elaborator
            chunks={chunks}
            profile={profile}
            onAddChunk={handleAddChunk}
            onDeleteChunk={handleDeleteChunk}
          />
        )}

        {/* =============================================================== */}
        {/* TAB: LOGS & STATS */}
        {/* =============================================================== */}
        {activeTab === "dashboard" && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    直近の反応潜時 &amp; FSRS 記憶安定度 S ログ（平均 {avgLatencyMs}ms）
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
                  進捗リセット
                </button>
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">
                  まだトレーニングログがありません。
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">チャンク</th>
                        <th className="py-2 pr-4">正誤</th>
                        <th className="py-2 pr-4">反応潜時</th>
                        <th className="py-2 pr-4">安定度 S</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.slice(0, 15).map((log) => (
                        <tr key={log.id} className="text-slate-200">
                          <td className="py-2.5 pr-4 font-bold">
                            {log.chunkText}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={
                                log.isCorrect
                                  ? "text-emerald-400 font-bold"
                                  : "text-rose-400 font-bold"
                              }
                            >
                              {log.isCorrect ? "正解" : "不正解"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 font-mono">
                            {log.latencyMs} ms
                          </td>
                          <td className="py-2.5 pr-4 font-mono">
                            {log.stabilityBefore}d → {log.stabilityAfter}d
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

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-200">
                  🔒 Gemini API キーのセキュア設定（サーバーサイド専用）
                </div>
                <p>
                  ブラウザ（localStorageや通信ペイロード）からの漏洩を防ぐため、APIキーはプロジェクト直下の{" "}
                  <code className="text-cyan-300 font-mono">.env.local</code>{" "}
                  内の <code className="text-cyan-300 font-mono">GEMINI_API_KEY</code>{" "}
                  でのみ管理されます（Git管理対象外）。
                </p>
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
