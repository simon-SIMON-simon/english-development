"use client";

import React, { useState } from "react";
import { ChunkElaboration, ChunkItem, UserProfile } from "@/types/sep";
import { speakEnglishText } from "@/lib/audio/audio-engine";
import {
  Sparkles,
  Volume2,
  PlusCircle,
  BookOpen,
  Eye,
  UserCheck,
  Radio,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface Stage0ElaboratorProps {
  chunks: ChunkItem[];
  profile: UserProfile;
  onAddChunk: (newChunk: ChunkItem) => void;
  onDeleteChunk: (id: string) => void;
}

export default function Stage0Elaborator({
  chunks,
  profile,
  onAddChunk,
  onDeleteChunk,
}: Stage0ElaboratorProps) {
  const [rawInput, setRawInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState<{
    chunkText: string;
    meaningJa: string;
    elaboration: ChunkElaboration;
    source?: string;
  } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim() || isLoading) return;
    setIsLoading(true);
    setJustSaved(false);

    try {
      const res = await fetch("/api/chunks/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: rawInput.trim(),
          userName: profile.displayName,
          specialtyDomains: profile.specialtyDomains,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerated({
          chunkText: data.chunkText,
          meaningJa: data.meaningJa,
          elaboration: {
            candidates: data.candidates,
            etymology: data.etymology,
            visualImage: data.visualImage,
            selfReference: data.selfReference,
            phonetics: data.phonetics,
          },
          source: data.source,
        });
        speakEnglishText(data.chunkText, 1.0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChunk = () => {
    if (!generated) return;
    const newChunk: ChunkItem = {
      id: crypto.randomUUID(),
      rawInput: rawInput.trim(),
      chunkText: generated.chunkText,
      meaningJa: generated.meaningJa,
      stage: 1,
      stability: 1.5,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      elaboration: generated.elaboration,
    };
    onAddChunk(newChunk);
    setJustSaved(true);
    setRawInput("");
  };

  return (
    <div className="space-y-8">
      {/* Stage 0 Header & Input Form */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Stage 0: チャンク登録 & 精緻化エンジン（記憶3 ＋ 自動化1）
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">
              単体語を「3〜5語のコロケーション」へ変換し二重符号化する
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              覚えたい単語や曖昧なフレーズを入力すると、語源・視覚イメージ・{profile.displayName}の専門領域（
              {profile.specialtyDomains.join(" / ")}）に紐づく自己参照文脈を即座に生成します。
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 mt-5">
          <input
            type="text"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="単語または表現を入力 (例: mitigate, leverage, catalyst, compelling...)"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !rawInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "3〜5語チャンクへ精緻化中..." : "AIチャンク化 & 二重符号化"}
          </button>
        </form>

        {/* Quick Preset Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>ワンクリック試用:</span>
          {["mitigate", "leverage", "catalyst", "compelling", "unprecedented"].map(
            (word) => (
              <button
                key={word}
                type="button"
                onClick={() => setRawInput(word)}
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-slate-300 hover:border-indigo-400 hover:text-white transition cursor-pointer"
              >
                {word}
              </button>
            )
          )}
        </div>
      </div>

      {/* Elaboration Result Card */}
      {generated && (
        <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                変換された3〜5語コロケーション（共起チャンク）
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {generated.chunkText}
                </h3>
                <button
                  type="button"
                  onClick={() => speakEnglishText(generated.chunkText, 1.0)}
                  className="rounded-full bg-indigo-500/20 p-2.5 text-indigo-300 hover:bg-indigo-500/30 transition cursor-pointer"
                  title="チャンク音声を再生"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1 text-base font-medium text-slate-300">
                核となる概念: <span className="text-amber-300">{generated.meaningJa}</span>
              </p>
            </div>

            <div>
              {justSaved ? (
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-3 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                  Stage 1 高速検索パイプラインに登録済み
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterChunk}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-emerald-500 transition cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  このチャンクをStage 1へ登録する
                </button>
              )}
            </div>
          </div>

          {/* Alternative Candidates */}
          {generated.elaboration.candidates &&
            generated.elaboration.candidates.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">他の共起候補に切替:</span>
                {generated.elaboration.candidates.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setGenerated({
                        ...generated,
                        chunkText: cand.chunkText,
                        meaningJa: cand.meaningJa,
                      })
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition cursor-pointer ${
                      generated.chunkText === cand.chunkText
                        ? "border-indigo-400 bg-indigo-500/20 text-white"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {cand.chunkText} ({cand.register})
                  </button>
                ))}
              </div>
            )}

          {/* Dual Coding 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase">
                <BookOpen className="w-4 h-4" />
                1. 語源分解（接頭辞・語根・コアニュアンス）
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                <p>
                  <span className="text-slate-400">接頭辞:</span>{" "}
                  <span className="font-mono text-white">
                    {generated.elaboration.etymology.prefix}
                  </span>{" "}
                  / <span className="text-slate-400">語根:</span>{" "}
                  <span className="font-mono text-white">
                    {generated.elaboration.etymology.root}
                  </span>
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {generated.elaboration.etymology.nuance}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase">
                <Eye className="w-4 h-4" />
                2. 視覚的イメージ（二重符号化・メンタルモデル）
              </div>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                {generated.elaboration.visualImage}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
                  <UserCheck className="w-4 h-4" />
                  3. 自己参照文脈（{generated.elaboration.selfReference.domain}）
                </div>
                <button
                  type="button"
                  onClick={() =>
                    speakEnglishText(
                      generated.elaboration.selfReference.exampleEn,
                      1.0
                    )
                  }
                  className="text-xs text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 例文再生
                </button>
              </div>
              <p className="mt-2 text-sm font-medium text-white">
                &ldquo;{generated.elaboration.selfReference.exampleEn}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {generated.elaboration.selfReference.exampleJa}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase">
                <Radio className="w-4 h-4" />
                4. 音声知覚・リンキング＆弱形構造
              </div>
              <p className="mt-2 font-mono text-sm text-cyan-200">
                {generated.elaboration.phonetics.ipa}
              </p>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {generated.elaboration.phonetics.linkingAndWeakForms}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registered Chunks Inventory */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          登録済みチャンク・パイプライン一覧（全 {chunks.length.toLocaleString()} チャンク中 先頭60件表示）
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chunks.slice(0, 60).map((chunk) => (
            <div
              key={chunk.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      chunk.stage === 3
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : chunk.stage === 2
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    Stage {chunk.stage} (S = {chunk.stability}d)
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {chunk.bestLatencyMs && (
                      <span className="font-mono text-cyan-300">
                        ⚡ Best: {chunk.bestLatencyMs}ms
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => speakEnglishText(chunk.chunkText, 1.0)}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="音声を再生"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteChunk(chunk.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  {chunk.chunkText}
                </div>
                <div className="text-xs text-amber-300/90 mt-0.5">
                  {chunk.meaningJa}
                </div>
                <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                  <span className="text-slate-500">自己参照:</span>{" "}
                  {chunk.elaboration.selfReference.exampleEn}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
