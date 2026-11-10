import { ChunkItem, LearningSetId, LearningSetMeta, StageNumber } from "@/types/sep";
import {
  PEL_CATALOG,
  ACL_CATALOG,
  AFL_CATALOG,
  PVPL_FULL_CATALOG,
  RAW_TOTAL_BEFORE_DEDUP,
  RawCorpusTuple,
} from "@/lib/data/corpus-catalog";

export { RAW_TOTAL_BEFORE_DEDUP };

export const LEARNING_SETS_METADATA: Record<LearningSetId, LearningSetMeta> = {
  PEL: {
    id: "PEL",
    name: "Phrasal Expressions List (PEL)",
    nameJa: "最重要句表現・定型句リスト (505表現)",
    descriptionJa:
      "Martinez & Schmitt (2012) が開発した、ネイティブスピーカーのコーパス（BNC）で高頻度に出現する505の定型表現リスト。全収録表現をPhase 1（3000ms検索）・Phase 2（200語多読＆短文生成）・Phase 3（AI反駁スプリント）のすべてで使用可能です。",
    academicCitation:
      "Martinez, R., & Schmitt, N. (2012). A Phrasal Expressions List. Applied Linguistics.",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    itemCount: PEL_CATALOG.length,
  },
  ACL: {
    id: "ACL",
    name: "Academic Collocation List (ACL)",
    nameJa: "学術・知的議論コロケーションリスト (重複排除済 2,265表現)",
    descriptionJa:
      "Ackermann & Chen (Pearson, 2013) が学術英語コーパスから抽出した2,469の最重要コロケーション（他リストとの重複排除後2,265表現）。知的な論文・技術議論・戦略会議で必須となる共起パターンをすべてPhase 1〜3で横断的に鍛錬できます。",
    academicCitation:
      "Ackermann, K., & Chen, Y. H. (2013). Developing the Academic Collocation List (ACL). Pearson.",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    itemCount: ACL_CATALOG.length,
  },
  AFL: {
    id: "AFL",
    name: "Academic Formulas List (AFL)",
    nameJa: "学術定型フォーミュラ・談話標識リスト (600表現)",
    descriptionJa:
      "Simpson-Vlach & Ellis (2010) が提唱した、学術スピーキングおよびライティングにおいて論理展開・立場表明・議論の接続を司る定型表現リスト。全600フォーミュラを全Phaseで運用可能です。",
    academicCitation:
      "Simpson-Vlach, R., & Ellis, N. C. (2010). An Academic Formulas List (AFL). Applied Linguistics.",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    itemCount: AFL_CATALOG.length,
  },
  PVPL: {
    id: "PVPL",
    name: "Phrasal Verb Pedagogical List (PVPL)",
    nameJa: "教育用最重要句動詞リスト（全150句動詞網羅）",
    descriptionJa:
      "Garnier & Schmitt (2015) による、現代英語で最も高頻度かつ重要な150の句動詞とそのコア意味を完全網羅したリスト。全150句動詞チャンクをPhase 1〜3のすべてのトレーニングで自在に使用できます。",
    academicCitation:
      "Garnier, M., & Schmitt, N. (2015). The PHaVE List: Phrasal Verbs for English Language Learners. Language Teaching Research.",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    itemCount: PVPL_FULL_CATALOG.length,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Workspace Deck",
    nameJa: "カスタム個人デッキ",
    descriptionJa:
      "ユーザーがStage 0で独自に精緻化・登録したオリジナルチャンク群。",
    academicCitation: "User Generated Custom Corpus",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    itemCount: 0,
  },
};

const DOMAINS = [
  "ソフトウェアアーキテクチャ・AI開発",
  "プロダクト戦略・意思決定",
  "認知科学・第二言語習得",
];

const PREDICATIVE_CHUNKS = new Set([
  "out of the question",
  "out of date",
  "out of order",
  "out of control",
  "out of reach",
  "out of sight",
  "under control",
  "under consideration",
  "under construction",
  "under pressure",
  "up to date",
  "at stake",
  "in progress",
  "in vain",
]);

/**
 * チャンクの統語パターンに応じて自然な実践ミニ例文（英語＋日本語訳）を生成
 * Step 2（実践ミニ例文の穴埋め）でそのまま穴埋め問題として機能する
 */
export function buildPracticalMiniExample(
  chunkText: string,
  meaningJa: string
): { exampleEn: string; exampleJa: string } {
  const lower = chunkText.toLowerCase().trim();
  const cleanMeaning = meaningJa.replace(/[〜：:]/g, "").trim();

  // 1. that節を導く構文
  if (lower.endsWith(" that")) {
    if (lower.startsWith("it ") || lower.startsWith("there ")) {
      return {
        exampleEn: `${chunkText} this architecture significantly reduces latency.`,
        exampleJa: `この設計によってレイテンシが大幅に削減される（${cleanMeaning}）。`,
      };
    }
    return {
      exampleEn: `We approved the release ${chunkText} all automated tests pass.`,
      exampleJa: `すべての自動テストを通過する（${cleanMeaning}）、リリースを承認した。`,
    };
  }

  // 2. 主語＋動詞で始まるスタンス表現 (it is ... to / we need to / engineers strive to 等)
  if (
    /^(it is |we |one can |researchers |engineers |leaders |systems |as far as )/.test(
      lower
    )
  ) {
    if (lower === "as far as i am concerned") {
      return {
        exampleEn: `${chunkText}, code readability always comes first.`,
        exampleJa: `${cleanMeaning}、コードの可読性が常に最優先だ。`,
      };
    }
    if (/\b(between)$/.test(lower)) {
      return {
        exampleEn: `${chunkText} the two competing designs.`,
        exampleJa: `競合する2つの設計について（${cleanMeaning}）。`,
      };
    }
    if (/\b(of|in|on|for|to|from|with)$/.test(lower)) {
      return {
        exampleEn: `${chunkText} the core system before launch.`,
        exampleJa: `ローンチ前にコアシステムについて（${cleanMeaning}）。`,
      };
    }
    return {
      exampleEn: `${chunkText} before scaling the platform.`,
      exampleJa: `プラットフォームを拡張する前に、（${cleanMeaning}）。`,
    };
  }

  // 3. be動詞の補語になる表現
  if (PREDICATIVE_CHUNKS.has(lower)) {
    return {
      exampleEn: `The legacy module is currently ${chunkText}.`,
      exampleJa: `そのレガシーモジュールは現在（${cleanMeaning}）の状態だ。`,
    };
  }
  if (lower === "at odds with") {
    return {
      exampleEn: `This proposal is ${chunkText} our security policy.`,
      exampleJa: `この提案は私たちのセキュリティ方針と（${cleanMeaning}）いる。`,
    };
  }
  if (lower === "at a loss") {
    return {
      exampleEn: `The team was ${chunkText} when the main server went down.`,
      exampleJa: `メインサーバーが停止した際、チームは（${cleanMeaning}）いた。`,
    };
  }
  if (lower === "by far the most") {
    return {
      exampleEn: `This is ${chunkText} reliable method we have tested.`,
      exampleJa: `これは私たちが検証した中で（${cleanMeaning}）信頼できる手法だ。`,
    };
  }
  if (lower === "by no means") {
    return {
      exampleEn: `The current pipeline is ${chunkText} complete yet.`,
      exampleJa: `現在のパイプラインはまだ（${cleanMeaning}）完成していない。`,
    };
  }
  if (lower === "in order to") {
    return {
      exampleEn: `We simplified the interface ${chunkText} reduce user friction.`,
      exampleJa: `ユーザーの摩擦を減らす（${cleanMeaning}）、インターフェースを簡素化した。`,
    };
  }
  if (lower === "as well as") {
    return {
      exampleEn: `The new engine improves speed ${chunkText} memory efficiency.`,
      exampleJa: `新エンジンはメモリ効率（${cleanMeaning}）処理速度も向上させる。`,
    };
  }

  // 4. 前置詞・副詞で始まる定型句
  if (
    /^(in |on |at |by |for |with |from |out of |under |up to |prior to|subsequent to|across |around |behind |off |without |to |as |once |first )/.test(
      lower
    )
  ) {
    if (lower.endsWith(" the")) {
      return {
        exampleEn: `We adjusted our plan ${chunkText} latest benchmark results.`,
        exampleJa: `最新のベンチマーク結果（${cleanMeaning}）、計画を調整した。`,
      };
    }
    if (/\b(of|to|with|for|from)$/.test(lower)) {
      return {
        exampleEn: `We redesigned the workflow ${chunkText} recent empirical data.`,
        exampleJa: `最近の実証データ（${cleanMeaning}）、ワークフローを再設計した。`,
      };
    }
    return {
      exampleEn: `We decided to refactor the core module ${chunkText}.`,
      exampleJa: `（${cleanMeaning}）、私たちはコアモジュールを改修することに決めた。`,
    };
  }

  // 5. 動詞チャンク (ACL / PVPL 等)
  if (lower.startsWith("be ")) {
    return {
      exampleEn: `This caching layer will ${chunkText} reducing response time.`,
      exampleJa: `このキャッシュ層は応答時間の短縮において（${cleanMeaning}）だろう。`,
    };
  }
  if (lower.endsWith(" between")) {
    return {
      exampleEn: `We must ${chunkText} speed and long-term maintainability.`,
      exampleJa: `スピードと長期的な保守性の（${cleanMeaning}）必要がある。`,
    };
  }
  if (lower === "give rise to unintended") {
    return {
      exampleEn: `A rushed update may ${chunkText} side effects in production.`,
      exampleJa: `急場しのぎの更新は本番環境で（${cleanMeaning}）副作用を生む恐れがある。`,
    };
  }
  if (lower === "take into full account" || lower === "take for granted") {
    return {
      exampleEn: `Engineers must ${chunkText} potential network failures.`,
      exampleJa: `エンジニアは潜在的なネットワーク障害を（${cleanMeaning}）必要がある。`,
    };
  }
  if (/\b(in|on|to|of|for|into|over|with|from)$/.test(lower)) {
    return {
      exampleEn: `Our team aims to ${chunkText} the new system architecture.`,
      exampleJa: `私たちのチームは新システム設計において（${cleanMeaning}）ことを目指している。`,
    };
  }

  return {
    exampleEn: `Our team decided to ${chunkText} before the next release.`,
    exampleJa: `次のリリース前に、チームは（${cleanMeaning}）ことに決めた。`,
  };
}

function buildChunksFromCatalog(
  setId: LearningSetId,
  catalog: RawCorpusTuple[]
): ChunkItem[] {
  return catalog.map(([chunkText, meaningJa, coreWord, customNuance], idx) => {
    const stage: StageNumber =
      idx % 3 === 0 ? 1 : idx % 3 === 1 ? 2 : 3;
    const stability =
      stage === 1
        ? Number((2.5 + (idx % 4)).toFixed(1))
        : stage === 2
        ? Number((9.5 + (idx % 9)).toFixed(1))
        : Number((22.5 + (idx % 8)).toFixed(1));

    const domain = DOMAINS[idx % DOMAINS.length];
    const detailedExplanation =
      customNuance ||
      `単体語「${coreWord}」としてではなく、共起チャンク『${chunkText}』（${meaningJa}）を1つの手続き記憶ブロックとして脳内に格納することで、リスニング知覚とスピーキング発話の双方で3000ms以内の即時処理を実現します。`;

    const miniExample = buildPracticalMiniExample(chunkText, meaningJa);

    return {
      id: `${setId.toLowerCase()}-${idx + 1}`,
      rawInput: coreWord,
      chunkText,
      meaningJa,
      stage,
      sourceSet: setId,
      stability,
      difficulty: Number((4.2 + (idx % 15) * 0.1).toFixed(1)),
      reps: stage === 1 ? 2 : stage === 2 ? 5 : 8,
      lapses: 0,
      lastLatencyMs: stage === 1 ? 2150 : stage === 2 ? 1620 : 1340,
      bestLatencyMs: stage === 1 ? 1920 : stage === 2 ? 1450 : 1210,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      elaboration: {
        etymology: {
          prefix: `${setId} #${idx + 1}`,
          root: `核となる語彙: "${coreWord}"`,
          nuance: detailedExplanation,
        },
        visualImage: `「${chunkText}」というチャンクの塊が概念「${meaningJa}」と直結し、3000ms以内に瞬時に引き出されるメンタルモデル`,
        selfReference: {
          domain,
          exampleEn: miniExample.exampleEn,
          exampleJa: miniExample.exampleJa,
        },
        phonetics: {
          ipa: `/${chunkText.toLowerCase()}/`,
          linkingAndWeakForms:
            "内容語に強い強勢（ストレス）を置き、前置詞・冠詞などの機能語は弱形（シュワー /ə/）に圧縮して直前の語末子音とリエゾン（連結）させます。",
        },
      },
    };
  });
}

export const PRESET_LEARNING_SETS_CHUNKS: Record<LearningSetId, ChunkItem[]> = {
  PEL: buildChunksFromCatalog("PEL", PEL_CATALOG),
  ACL: buildChunksFromCatalog("ACL", ACL_CATALOG),
  AFL: buildChunksFromCatalog("AFL", AFL_CATALOG),
  PVPL: buildChunksFromCatalog("PVPL", PVPL_FULL_CATALOG),
  CUSTOM: [],
};
