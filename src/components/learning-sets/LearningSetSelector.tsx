"use client";

import React, { useState } from "react";
import { ChunkItem, LearningSetId } from "@/types/sep";
import {
  LEARNING_SETS_METADATA,
  PRESET_LEARNING_SETS_CHUNKS,
} from "@/lib/data/learning-sets";
import { speakEnglishText } from "@/lib/audio/audio-engine";
import {
  CheckCircle2,
  Download,
  GraduationCap,
  Volume2,
  FileText,
  Zap,
  BookOpen,
  Flame,
} from "lucide-react";

interface LearningSetSelectorProps {
  currentChunks: ChunkItem[];
  selectedSetFilter: LearningSetId | "ALL";
  onSelectSetFilter: (filter: LearningSetId | "ALL") => void;
  onImportSet: (setId: LearningSetId) => void;
  onImportAllSets: () => void;
  onStartWorkoutWithSet?: (setId: LearningSetId, phase?: 1 | 2 | 3) => void;
}

export default function LearningSetSelector({
  currentChunks,
  onSelectSetFilter,
  onImportSet,
  onImportAllSets,
  onStartWorkoutWithSet,
}: LearningSetSelectorProps) {
  const [activeTab, setActiveTab] = useState<LearningSetId>("PEL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(120);
  const metaList: LearningSetId[] = ["PEL", "ACL", "AFL", "PVPL"];

  const activeMeta = LEARNING_SETS_METADATA[activeTab];
  const activeChunks = PRESET_LEARNING_SETS_CHUNKS[activeTab] || [];

  const totalCatalogCount = metaList.reduce(
    (sum, id) => sum + (PRESET_LEARNING_SETS_CHUNKS[id]?.length || 0),
    0
  );

  const filteredActiveChunks = searchQuery.trim()
    ? activeChunks.filter(
        (c) =>
          c.chunkText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.meaningJa.includes(searchQuery)
      )
    : activeChunks;

  const displayedChunks = filteredActiveChunks.slice(0, visibleLimit);

  const installedCount = currentChunks.filter(
    (c) => c.sourceSet === activeTab
  ).length;
  const isFullyInstalled =
    installedCount >= activeChunks.length && activeChunks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <GraduationCap className="w-4 h-4" />
              原典総計 3,724表現 → 重複排除済 {totalCatalogCount.toLocaleString()} ユニーク表現収録
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PEL (505)・ACL (2,265)・AFL (600)・PVPL (150) 全表現 × 全Phase完全対応
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              4大コーパス（原典計3,724表現）からリスト間の重複を排除した全{totalCatalogCount.toLocaleString()}表現を完全収録。すべての表現をPhase 1（3000ms瞬間検索）・Phase 2（200語多読＆短文生成）・Phase 3（AI音声反駁＆90/60/45秒スプリント）で制限なく使用できます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onImportAllSets}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl hover:from-indigo-400 hover:to-cyan-400 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              全4セットを一括同期（全 {totalCatalogCount} チャンク）
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metaList.map((id) => {
          const meta = LEARNING_SETS_METADATA[id];
          const chunks = PRESET_LEARNING_SETS_CHUNKS[id];
          const active = activeTab === id;
          const currentCount = currentChunks.filter(
            (c) => c.sourceSet === id
          ).length;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                onSelectSetFilter(id);
              }}
              className={`rounded-2xl border p-5 text-left transition cursor-pointer flex flex-col justify-between ${
                active
                  ? "border-indigo-400 bg-slate-900 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider border ${meta.badgeColor}`}
                  >
                    {meta.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    全 {chunks.length} 表現
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-white line-clamp-1">
                  {meta.nameJa}
                </h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {meta.name}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  利用可能:{" "}
                  <strong className="text-emerald-300">
                    {currentCount} / {chunks.length} 表現
                  </strong>
                </span>
                {currentCount >= chunks.length && chunks.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Set Detail & Chunks Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider border ${activeMeta.badgeColor}`}
              >
                {activeMeta.id}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeMeta.name}（全 {activeChunks.length} 表現）
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
              {activeMeta.descriptionJa}
            </p>
            <div className="mt-2 text-xs font-mono text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              学術文献: {activeMeta.academicCitation}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isFullyInstalled && (
              <button
                type="button"
                onClick={() => onImportSet(activeTab)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                全表現をデッキへ同期
              </button>
            )}

            {onStartWorkoutWithSet && (
              <>
                <button
                  type="button"
                  onClick={() => onStartWorkoutWithSet(activeTab, 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Phase 1 (3000ms検索) で開始
                </button>
                <button
                  type="button"
                  onClick={() => onStartWorkoutWithSet(activeTab, 2)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Phase 2 (200語多読) で開始
                </button>
                <button
                  type="button"
                  onClick={() => onStartWorkoutWithSet(activeTab, 3)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Phase 3 (AI反駁) で開始
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Chunks List */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {activeMeta.id} 収録表現一覧（表示中: {filteredActiveChunks.length} / 全 {activeChunks.length} 件 — 全Phaseで利用可能）
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${activeMeta.id} 内の英語表現・日本語訳を検索...`}
              className="w-full sm:w-72 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {displayedChunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    #{idx + 1} · All Phases Enabled
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglishText(chunk.chunkText, 1.0)}
                    className="rounded-full bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
                    title="音声を再生"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-sm font-bold text-white">
                  {chunk.chunkText}
                </div>
                <div className="text-xs text-amber-300/90 font-medium">
                  {chunk.meaningJa}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-900">
                  {chunk.elaboration.etymology.nuance}
                </div>
              </div>
            ))}
          </div>

          {filteredActiveChunks.length > visibleLimit && (
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + 200)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                さらに200件を表示（残り {filteredActiveChunks.length - visibleLimit} 件）
              </button>
              <button
                type="button"
                onClick={() => setVisibleLimit(filteredActiveChunks.length)}
                className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 cursor-pointer"
              >
                全 {filteredActiveChunks.length} 件をすべて展開
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
