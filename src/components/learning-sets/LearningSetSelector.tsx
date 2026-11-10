"use client";

import React, { useState } from "react";
import { ChunkItem, LearningSetId } from "@/types/sep";
import {
  LEARNING_SETS_METADATA,
  PRESET_LEARNING_SETS_CHUNKS,
} from "@/lib/data/learning-sets";
import { speakEnglishText } from "@/lib/audio/audio-engine";
import {
  BookMarked,
  CheckCircle2,
  Download,
  GraduationCap,
  Sparkles,
  Volume2,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";

interface LearningSetSelectorProps {
  currentChunks: ChunkItem[];
  selectedSetFilter: LearningSetId | "ALL";
  onSelectSetFilter: (filter: LearningSetId | "ALL") => void;
  onImportSet: (setId: LearningSetId) => void;
  onImportAllSets: () => void;
  onStartWorkoutWithSet?: (setId: LearningSetId) => void;
}

export default function LearningSetSelector({
  currentChunks,
  selectedSetFilter,
  onSelectSetFilter,
  onImportSet,
  onImportAllSets,
  onStartWorkoutWithSet,
}: LearningSetSelectorProps) {
  const [activeTab, setActiveTab] = useState<LearningSetId>("PEL");
  const metaList: LearningSetId[] = ["PEL", "ACL", "AFL", "PVPL"];

  const activeMeta = LEARNING_SETS_METADATA[activeTab];
  const activeChunks = PRESET_LEARNING_SETS_CHUNKS[activeTab] || [];

  // 現在のデッキに含まれているチャンク数
  const installedCount = currentChunks.filter((c) => c.sourceSet === activeTab).length;
  const isFullyInstalled = installedCount >= activeChunks.length && activeChunks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <GraduationCap className="w-4 h-4" />
              SLA (第二言語習得論) 公認・4大重要コーパス学習セット
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PEL・ACL・AFL・PVPL 厳選学習セット
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              英語教育・コーパス言語学の世界的標準リストから、知的議論・高速検索・スピーキング自動化に直結する必須チャンクを網羅。各セットは語源・視覚・専門文脈（二重符号化）および音声知覚情報が完備されています。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onImportAllSets}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl hover:from-indigo-400 hover:to-cyan-400 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              全4セットを一括インポート（全40チャンク）
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
          const currentCount = currentChunks.filter((c) => c.sourceSet === id).length;

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
                    {chunks.length} チャンク
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
                  現在デッキ内:{" "}
                  <strong className="text-emerald-300">{currentCount}語</strong>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider border ${activeMeta.badgeColor}`}
              >
                {activeMeta.id}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeMeta.name}
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onImportSet(activeTab)}
              disabled={isFullyInstalled}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                isFullyInstalled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md"
              }`}
            >
              {isFullyInstalled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  デッキ登録完了 ({installedCount}/{activeChunks.length})
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  このセットをデッキへインポート
                </>
              )}
            </button>

            {onStartWorkoutWithSet && (
              <button
                type="button"
                onClick={() => onStartWorkoutWithSet(activeTab)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition cursor-pointer"
              >
                このセットでワークアウト開始
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chunks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              収録チャンク一覧（全 {activeChunks.length} 件）
            </span>
            <span>クリックで発音再生・二重符号化の確認が可能</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      chunk.stage === 3
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : chunk.stage === 2
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    Stage {chunk.stage} (S = {chunk.stability}d)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-300">
                      {chunk.elaboration.phonetics.ipa}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakEnglishText(chunk.chunkText, 1.0)}
                      className="rounded-full bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
                      title="音声を再生"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-base font-bold text-white">
                  {chunk.chunkText}
                </div>
                <div className="text-xs text-amber-300/90 font-medium">
                  {chunk.meaningJa}
                </div>

                <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/80 line-clamp-2">
                  <span className="text-slate-500">自己参照文:</span>{" "}
                  &ldquo;{chunk.elaboration.selfReference.exampleEn}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
