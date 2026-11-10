import { ChunkItem, LearningSetId, LearningSetMeta, StageNumber } from "@/types/sep";
import {
  PEL_CATALOG,
  ACL_CATALOG,
  AFL_CATALOG,
  PVPL_CATALOG,
  RawCorpusTuple,
} from "@/lib/data/corpus-catalog";

export const LEARNING_SETS_METADATA: Record<LearningSetId, LearningSetMeta> = {
  PEL: {
    id: "PEL",
    name: "Phrasal Expressions List (PEL)",
    nameJa: "最重要句表現・定型句リスト",
    descriptionJa:
      "Martinez & Schmitt (2012) が開発した、ネイティブスピーカーのコーパス（BNC）で高頻度に出現する定型表現リスト。全収録表現をPhase 1（3000ms検索）・Phase 2（200語多読＆短文生成）・Phase 3（AI反駁スプリント）のすべてで使用可能です。",
    academicCitation:
      "Martinez, R., & Schmitt, N. (2012). A Phrasal Expressions List. Applied Linguistics.",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    itemCount: PEL_CATALOG.length,
  },
  ACL: {
    id: "ACL",
    name: "Academic Collocation List (ACL)",
    nameJa: "学術・知的議論コロケーションリスト",
    descriptionJa:
      "Ackermann & Chen (Pearson, 2013) が学術英語コーパスから抽出した最重要コロケーション。知的な論文・技術議論・戦略会議で必須となる共起パターンをすべてPhase 1〜3で横断的に鍛錬できます。",
    academicCitation:
      "Ackermann, K., & Chen, Y. H. (2013). Developing the Academic Collocation List (ACL). Pearson.",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    itemCount: ACL_CATALOG.length,
  },
  AFL: {
    id: "AFL",
    name: "Academic Formulas List (AFL)",
    nameJa: "学術定型フォーミュラ（談話標識）リスト",
    descriptionJa:
      "Simpson-Vlach & Ellis (2010) が提唱した、学術スピーキングおよびライティングにおいて論理展開・立場表明・議論の接続を司る定型表現リスト。全フォーミュラを全Phaseで運用可能です。",
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
    itemCount: PVPL_CATALOG.length,
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

function buildChunksFromCatalog(
  setId: LearningSetId,
  catalog: RawCorpusTuple[]
): ChunkItem[] {
  return catalog.map(([chunkText, meaningJa, coreWord], idx) => {
    // 初期ステージ分布は FSRS 安定度 S の目安として付与するが、
    // すべてのPhase（Stage 1 / Stage 2 / Stage 3）で全チャンクが出題・選択可能
    const stage: StageNumber =
      idx % 3 === 0 ? 1 : idx % 3 === 1 ? 2 : 3;
    const stability =
      stage === 1
        ? Number((2.5 + (idx % 4)).toFixed(1))
        : stage === 2
        ? Number((9.5 + (idx % 9)).toFixed(1))
        : Number((22.5 + (idx % 8)).toFixed(1));

    const domain = DOMAINS[idx % DOMAINS.length];

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
          prefix: `${setId} Core Collocation`,
          root: `Core: "${coreWord}"`,
          nuance: `単体語「${coreWord}」ではなく、共起チャンク『${chunkText}』（${meaningJa}）を一つの運動プログラム（手続き記憶）として脳内に格納することで、発話・聴解時の処理コストを極小化します。`,
        },
        visualImage: `「${chunkText}」というチャンクの塊が一閃の光となって概念「${meaningJa}」と直結し、3000ms以内に瞬時に引き出されるメンタルモデル`,
        selfReference: {
          domain,
          exampleEn: `In our ${
            idx % 2 === 0 ? "AI architecture review" : "product strategy meeting"
          }, we utilized the expression "${chunkText}" to articulate our core point clearly.`,
          exampleJa: `西門の${domain}の文脈において、「${meaningJa}（${chunkText}）」を即座に運用して議論の核心を明確に伝えた。`,
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
  PVPL: buildChunksFromCatalog("PVPL", PVPL_CATALOG),
  CUSTOM: [],
};
