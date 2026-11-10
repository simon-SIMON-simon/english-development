"use client";

import { ChunkItem, LearningSetId, ReviewLog, UserProfile } from "@/types/sep";
import { PRESET_LEARNING_SETS_CHUNKS } from "@/lib/data/learning-sets";

const STORAGE_KEYS = {
  CHUNKS: "sep_chunks_v1",
  LOGS: "sep_review_logs_v1",
  PROFILE: "sep_user_profile_v1",
  ACTIVE_SET: "sep_active_set_v1",
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: "西門",
  specialtyDomains: [
    "ソフトウェアアーキテクチャ・AI開発",
    "プロダクト戦略・意思決定",
    "認知科学・第二言語習得",
  ],
  targetWpm: 145,
};

/**
 * TOEIC 935点・上級者プラトー打破向けの初期シードチャンク群
 * 起動直後から Stage 1 / Stage 2 / Stage 3 のすべてを即座に体験可能
 */
export const INITIAL_SEED_CHUNKS: ChunkItem[] = [
  // --- Stage 1 (S < 7.0d: 音声優先・3000ms高速検索対象) ---
  {
    id: "seed-s1-1",
    rawInput: "instrumental",
    chunkText: "be instrumental in",
    meaningJa: "〜において極めて重要な推進力となる",
    stage: 1,
    stability: 2.4,
    difficulty: 4.8,
    reps: 2,
    lapses: 0,
    lastLatencyMs: 2450,
    bestLatencyMs: 2120,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    elaboration: {
      etymology: {
        prefix: "in- (中へ・上に)",
        root: "struere (築く・組み立てる = structure と同根)",
        nuance:
          "単なる helpful ではなく、仕組みや成果の『骨格を築く不可欠な楽器・道具』として機能するニュアンス",
      },
      visualImage:
        "巨大な精密機械の中心に黄金のギアがカチッとはまり、システム全体が猛スピードで駆動し始める情景",
      selfReference: {
        domain: "ソフトウェアアーキテクチャ・AI開発",
        exampleEn:
          "Measuring millisecond voice latency was instrumental in breaking through my speaking plateau.",
        exampleJa:
          "ミリ秒単位の発話潜時を計測することが、私のスピーキングの停滞期を打破する上で決定的な推進力となった。",
      },
      phonetics: {
        ipa: "/bi ˌɪnstrəˈmɛntl ɪn/",
        linkingAndWeakForms:
          "be_instrumental が /biːjɪn/ と滑らかに母音連結し、末尾の /tl ɪn/ は舌先を歯茎に当てたまま側面開放で一気に /lɪn/ と繋げる",
      },
    },
  },
  {
    id: "seed-s1-2",
    rawInput: "concern",
    chunkText: "raise grave concerns over",
    meaningJa: "〜に対して深刻な懸念を提起する",
    stage: 1,
    stability: 4.9,
    difficulty: 5.1,
    reps: 3,
    lapses: 0,
    lastLatencyMs: 1980,
    bestLatencyMs: 1850,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    elaboration: {
      etymology: {
        prefix: "con- (共に・完全に)",
        root: "cernere (篩にかける・識別する = discern と同根)",
        nuance:
          "単に worry するのではなく、重要な問題を選び出して公の議論の場に『持ち上げる(raise)』知的表現",
      },
      visualImage:
        "暗い会議室の中央テーブルに、重く赤い警告灯（grave concern）を高々と掲げて全員の視線を集める様子",
      selfReference: {
        domain: "プロダクト戦略・意思決定",
        exampleEn:
          "Several engineers raised grave concerns over the latency of the third-party API.",
        exampleJa:
          "複数のエンジニアが、サードパーティAPIの遅延について深刻な懸念を提起した。",
      },
      phonetics: {
        ipa: "/reɪz ɡreɪv kənˈsɜːrnz ˈoʊvər/",
        linkingAndWeakForms:
          "concern の第1音節は完全に弱化して /kən/。concerns_over が /z_oʊvər/ と強くリエゾンする",
      },
    },
  },
  {
    id: "seed-s1-3",
    rawInput: "hinge",
    chunkText: "hinge entirely on",
    meaningJa: "〜に全面的にかかっている（左右される）",
    stage: 1,
    stability: 5.8,
    difficulty: 5.4,
    reps: 3,
    lapses: 0,
    lastLatencyMs: 2620,
    bestLatencyMs: 2200,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    elaboration: {
      etymology: {
        prefix: "-",
        root: "hang (吊るす・蝶番)",
        nuance:
          "depend on の高度な代替表現。重い扉がたった1つの蝶番（hinge）で支えられ、そこが動けば扉全体が動く決定的な依存関係",
      },
      visualImage:
        "巨大な城門がたった1つの鋼鉄の蝶番（ヒンジ）だけで支えられ、その一点に全重量がかかっている視覚イメージ",
      selfReference: {
        domain: "プロダクト戦略・意思決定",
        exampleEn:
          "The success of our next release hinges entirely on how quickly users feel the benefit.",
        exampleJa:
          "次期リリースの成否は、ユーザーがいかに早く価値を実感できるかに全面的にかかっている。",
      },
      phonetics: {
        ipa: "/hɪndʒ ɪnˈtaɪərli ɑːn/",
        linkingAndWeakForms:
          "hinge_entirely が /dʒɪn/ と連結し、entirely_on が /li_jɑːn/ とわたり音 /j/ を伴って繋がる",
      },
    },
  },
  {
    id: "seed-s1-4",
    rawInput: "Bottleneck",
    chunkText: "alleviate the bottleneck in",
    meaningJa: "〜におけるボトルネック（停滞要因）を緩和・解消する",
    stage: 1,
    stability: 3.2,
    difficulty: 5.6,
    reps: 2,
    lapses: 0,
    lastLatencyMs: 2790,
    bestLatencyMs: 2500,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    elaboration: {
      etymology: {
        prefix: "ad- -> al- (〜へ)",
        root: "levis (軽い = elevate, lever と同根)",
        nuance:
          "fix や solve よりも洗練された表現。重く詰まっていた負荷を『軽くして流れを良くする』知的な動詞コロケーション",
      },
      visualImage:
        "細く詰まったガラス瓶の首（bottleneck）がふわりと広がり、光る水流が一気にスムーズに流れ出すイメージ",
      selfReference: {
        domain: "ソフトウェアアーキテクチャ・AI開発",
        exampleEn:
          "Chunking words together helps alleviate the bottleneck in working memory during real-time speech.",
        exampleJa:
          "単語をチャンク化することで、リアルタイム発話時のワーキングメモリのボトルネックを緩和できる。",
      },
      phonetics: {
        ipa: "/əˈliːvieɪt ðə ˈbɑːtlnɛk ɪn/",
        linkingAndWeakForms:
          "alleviate の語末 /t/ は次の ðə の前で声門閉鎖音（ストップT）になり、bottleneck_in は /k_ɪn/ と連結する",
      },
    },
  },

  // --- Stage 2 (7.0 <= S < 21.0d: 動的文脈多読 200語 & 1.2xディクテーション & 短文生成対象) ---
  {
    id: "seed-s2-1",
    rawInput: "trade-off",
    chunkText: "strike a delicate balance between",
    meaningJa: "〜の間で絶妙なバランス（折り合い）をとる",
    stage: 2,
    stability: 11.5,
    difficulty: 4.9,
    reps: 5,
    lapses: 0,
    lastLatencyMs: 1650,
    bestLatencyMs: 1490,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    elaboration: {
      etymology: {
        prefix: "-",
        root: "strike (打ち当てる・ピタリと合わせる) + delicate (繊細な)",
        nuance:
          "keep a balance ではなく動詞に strike を使うことで、相反する2つの要素の均衡点を『鋭く見極めて打ち立てる』躍動感が出る",
      },
      visualImage:
        "刃の上で揺れる天秤の真ん中を、職人がハンマーで軽く一度叩いてピタリと水平に静止させる情景",
      selfReference: {
        domain: "ソフトウェアアーキテクチャ・AI開発",
        exampleEn:
          "We need to strike a delicate balance between model accuracy and response speed.",
        exampleJa:
          "モデルの精度と応答速度の間で絶妙なバランスをとる必要がある。",
      },
      phonetics: {
        ipa: "/straɪk ə ˈdɛlɪkət ˈbæləns bɪˈtwiːn/",
        linkingAndWeakForms:
          "strike_a が /straɪkə/ と一語化し、delicate の末尾 -ate は /ət/ と弱形になり語末 t はストップT化する",
      },
    },
  },
  {
    id: "seed-s2-2",
    rawInput: "scrutiny",
    chunkText: "come under intense scrutiny",
    meaningJa: "厳しい精査（追及・検証）の目にさらされる",
    stage: 2,
    stability: 14.2,
    difficulty: 5.5,
    reps: 6,
    lapses: 0,
    lastLatencyMs: 1720,
    bestLatencyMs: 1580,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    elaboration: {
      etymology: {
        prefix: "-",
        root: "scrutari (ガラクタの中を徹底的に探る・細部まで調べる)",
        nuance:
          "be checked closely のC1レベル表現。周囲や専門家から虫眼鏡で見られるような強い検証圧力を受ける状態",
      },
      visualImage:
        "ステージ上の設計図に対して、四方八方から強烈なスポットライトと拡大鏡が向けられている情景",
      selfReference: {
        domain: "プロダクト戦略・意思決定",
        exampleEn:
          "Our security architecture came under intense scrutiny during the enterprise audit.",
        exampleJa:
          "エンタープライズ監査において、我々のセキュリティ設計は厳しい精査にさらされた。",
      },
      phonetics: {
        ipa: "/kʌm ˈʌndər ɪnˈtɛns ˈskruːtəni/",
        linkingAndWeakForms:
          "come_under が /kʌmʌndər/、under_intense が /dərɪn/ と3語が切れ目なく連結する",
      },
    },
  },
  {
    id: "seed-s2-3",
    rawInput: "account",
    chunkText: "take into full account",
    meaningJa: "〜を十分に考慮に入れる",
    stage: 2,
    stability: 9.8,
    difficulty: 4.3,
    reps: 4,
    lapses: 0,
    lastLatencyMs: 1540,
    bestLatencyMs: 1380,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    elaboration: {
      etymology: {
        prefix: "ac- (〜へ)",
        root: "computare (計算に入れる・数える)",
        nuance:
          "think about や consider よりも『意思決定の計算式の中に漏れなく組み込む』という論理的ニュアンスが強い",
      },
      visualImage:
        "すべての変数カードを1枚残らず財務・設計ダッシュボードのスロットに差し込むイメージ",
      selfReference: {
        domain: "認知科学・第二言語習得",
        exampleEn:
          "This scheduler takes into full account both memory decay and reaction latency.",
        exampleJa:
          "このスケジューラは記憶の減衰と反応潜時の両方を十分に考慮に入れている。",
      },
      phonetics: {
        ipa: "/teɪk ˈɪntə fʊl əˈkaʊnt/",
        linkingAndWeakForms:
          "take_into が /teɪkɪntə/、full_account が /fʊləˈkaʊnt/ と連結する",
      },
    },
  },
  {
    id: "seed-s2-4",
    rawInput: "yield",
    chunkText: "yield tangible results in",
    meaningJa: "〜において目に見える（具体的な）成果を生み出す",
    stage: 2,
    stability: 16.4,
    difficulty: 4.7,
    reps: 6,
    lapses: 0,
    lastLatencyMs: 1610,
    bestLatencyMs: 1420,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 16).toISOString(),
    elaboration: {
      etymology: {
        prefix: "-",
        root: "yield (畑が収穫を産出する) + tangere (触れることができる = touch)",
        nuance:
          "get good results を一気に知的にする表現。抽象論ではなく『手で触れられるほど明確な成果』を産出する",
      },
      visualImage:
        "豊かな土壌から、手で触れられる黄金の果実（tangible results）が次々と実るイメージ",
      selfReference: {
        domain: "プロダクト戦略・意思決定",
        exampleEn:
          "Focusing on high-frequency collocations yielded tangible results in my speaking fluency within two weeks.",
        exampleJa:
          "高頻度コロケーションに集中したことで、2週間以内にスピーキングの流暢さにおいて目に見える成果が出た。",
      },
      phonetics: {
        ipa: "/jiːld ˈtændʒəbl rɪˈzʌlts ɪn/",
        linkingAndWeakForms:
          "yield の語末 /d/ は次の /t/ に同化して事実上1回の閉鎖になり、results_in が /ts_ɪn/ と連結する",
      },
    },
  },
  {
    id: "seed-s2-5",
    rawInput: "assumption",
    chunkText: "call into question the assumption",
    meaningJa: "〜という前提（思い込み）に疑問を投げかける",
    stage: 2,
    stability: 12.8,
    difficulty: 5.3,
    reps: 5,
    lapses: 0,
    lastLatencyMs: 1790,
    bestLatencyMs: 1600,
    nextReview: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 13).toISOString(),
    elaboration: {
      etymology: {
        prefix: "ad- -> as- (〜へ)",
        root: "sumere (取り上げる・当然視する)",
        nuance:
          "doubt の知的代替。誰もが当たり前だと思っていた前提（assumption）を審問の場（question）へと呼び出す",
      },
      visualImage:
        "当たり前のように建っていた土台の柱にクエスチョンマークのスポットライトを当てて揺さぶるイメージ",
      selfReference: {
        domain: "認知科学・第二言語習得",
        exampleEn:
          "Recent research calls into question the assumption that passive reading alone builds speaking fluency.",
        exampleJa:
          "近年の研究は、受動的な多読だけでスピーキングの流暢さが育つという前提に疑問を投げかけている。",
      },
      phonetics: {
        ipa: "/kɔːl ˈɪntə ˈkwɛstʃən ði əˈsʌmpʃən/",
        linkingAndWeakForms:
          "call_into が /kɔːlɪntə/、the_assumption が母音前のため /ði_jəˈsʌmpʃən/ と連結する",
      },
    },
  },

  // --- Stage 3 (S >= 21.0d: AI音声反駁 & 90/60/45秒 圧縮スプリント対象) ---
  {
    id: "seed-s3-1",
    rawInput: "expense",
    chunkText: "at the expense of",
    meaningJa: "〜を犠牲にして（代償として）",
    stage: 3,
    stability: 26.5,
    difficulty: 4.5,
    reps: 9,
    lapses: 0,
    lastLatencyMs: 1320,
    bestLatencyMs: 1180,
    nextReview: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 28).toISOString(),
    elaboration: {
      etymology: {
        prefix: "ex- (外へ)",
        root: "pendere (重さを量って支払う = spend と同根)",
        nuance:
          "一方のメリットを得るために、もう一方の重要な価値を『コストとして支払って損なう』トレードオフの必須表現",
      },
      visualImage:
        "スピードメーターを振り切らせるために、品質という燃料タンクを燃やして消費している情景",
      selfReference: {
        domain: "ソフトウェアアーキテクチャ・AI開発",
        exampleEn:
          "We must never pursue short-term delivery speed at the expense of long-term maintainability.",
        exampleJa:
          "長期的な保守性を犠牲にしてまで、短期的なデリバリー速度を追求してはならない。",
      },
      phonetics: {
        ipa: "/æt ði ɪkˈspɛns əv/",
        linkingAndWeakForms:
          "at の /t/ はストップT、the_expense_of が /ði_jɪkˈspɛnsəv/ と一息の塊として発音される",
      },
    },
  },
  {
    id: "seed-s3-2",
    rawInput: "viable",
    chunkText: "remain a viable option for",
    meaningJa: "〜にとって依然として実現可能な（現実的な）選択肢であり続ける",
    stage: 3,
    stability: 24.0,
    difficulty: 4.8,
    reps: 8,
    lapses: 0,
    lastLatencyMs: 1410,
    bestLatencyMs: 1290,
    nextReview: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    elaboration: {
      etymology: {
        prefix: "-",
        root: "vita / vie (生命・生き残れる力)",
        nuance:
          "possible よりも『実務上・経済上、実際に生き残って機能し得る（生存力がある）』という強い説得力を持つ",
      },
      visualImage:
        "厳しい嵐の中でも力強く根を張り、青々と生き残っている1本のルート（道）",
      selfReference: {
        domain: "プロダクト戦略・意思決定",
        exampleEn:
          "Running lightweight models locally remains a viable option for latency-critical features.",
        exampleJa:
          "遅延が致命的となる機能においては、軽量モデルをローカルで動かすことが依然として現実的な選択肢であり続ける。",
      },
      phonetics: {
        ipa: "/rɪˈmeɪn ə ˈvaɪəbl ˈɑːpʃən fɔːr/",
        linkingAndWeakForms:
          "remain_a が /rɪˈmeɪnə/、viable_option が /ˈvaɪəbl_ˈɑːpʃən/ と滑らかに連結する",
      },
    },
  },
  {
    id: "seed-s3-3",
    rawInput: "diminishing",
    chunkText: "reach a point of diminishing returns",
    meaningJa: "収穫逓減（労力に対して成果が頭打ちになる）の地点に達する",
    stage: 3,
    stability: 29.4,
    difficulty: 5.2,
    reps: 10,
    lapses: 0,
    lastLatencyMs: 1480,
    bestLatencyMs: 1350,
    nextReview: new Date(Date.now() + 86400000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    elaboration: {
      etymology: {
        prefix: "di- (離れて) + min- (小さくする = mini)",
        root: "diminish (減少する) + return (見返り)",
        nuance:
          "『これ以上同じやり方を続けても効率が落ちるだけだ』と論理的に反駁・方向転換を提案する際の最強のチャンク",
      },
      visualImage:
        "急上昇していたグラフの曲線が緩やかになり、どれだけエネルギーを注いでも水平に寝てしまう変曲点",
      selfReference: {
        domain: "認知科学・第二言語習得",
        exampleEn:
          "Memorizing isolated word lists quickly reaches a point of diminishing returns once you pass TOEIC 900.",
        exampleJa:
          "単語リストの丸暗記は、TOEIC 900点を超えるとすぐに収穫逓減の頭打ち地点に達する。",
      },
      phonetics: {
        ipa: "/riːtʃ ə pɔɪnt əv dɪˈmɪnɪʃɪŋ rɪˈtɜːrnz/",
        linkingAndWeakForms:
          "reach_a が /riːtʃə/、point_of がフラッピングまたは脱落により /pɔɪnəv/ と高速発音される",
      },
    },
  },
];

export function getAllPresetChunks(): ChunkItem[] {
  return [
    ...PRESET_LEARNING_SETS_CHUNKS.PEL,
    ...PRESET_LEARNING_SETS_CHUNKS.ACL,
    ...PRESET_LEARNING_SETS_CHUNKS.AFL,
    ...PRESET_LEARNING_SETS_CHUNKS.PVPL,
  ];
}

export function loadChunks(): ChunkItem[] {
  if (typeof window === "undefined") return getAllPresetChunks();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHUNKS);
    if (!raw) {
      const presets = getAllPresetChunks();
      localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(presets));
      return presets;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : getAllPresetChunks();
  } catch {
    return getAllPresetChunks();
  }
}

export function saveChunks(chunks: ChunkItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
}

export function importLearningSet(setId: LearningSetId): ChunkItem[] {
  const current = loadChunks();
  const toImport = PRESET_LEARNING_SETS_CHUNKS[setId] || [];
  
  // 既存のIDと重複しないようにマージ、既存にあれば上書きまたは維持
  const currentMap = new Map(current.map((c) => [c.chunkText.toLowerCase(), c]));
  toImport.forEach((item) => {
    if (!currentMap.has(item.chunkText.toLowerCase())) {
      currentMap.set(item.chunkText.toLowerCase(), item);
    }
  });

  const next = Array.from(currentMap.values());
  saveChunks(next);
  return next;
}

export function importAllLearningSets(): ChunkItem[] {
  const all = getAllPresetChunks();
  const current = loadChunks();
  const currentMap = new Map(current.map((c) => [c.chunkText.toLowerCase(), c]));
  all.forEach((item) => {
    if (!currentMap.has(item.chunkText.toLowerCase())) {
      currentMap.set(item.chunkText.toLowerCase(), item);
    }
  });
  const next = Array.from(currentMap.values());
  saveChunks(next);
  return next;
}

export function upsertChunk(chunk: ChunkItem): ChunkItem[] {
  const current = loadChunks();
  const idx = current.findIndex((c) => c.id === chunk.id);
  let next: ChunkItem[];
  if (idx >= 0) {
    next = [...current];
    next[idx] = chunk;
  } else {
    next = [chunk, ...current];
  }
  saveChunks(next);
  return next;
}

export function deleteChunkById(id: string): ChunkItem[] {
  const current = loadChunks().filter((c) => c.id !== id);
  saveChunks(current);
  return current;
}

export function resetToSeedChunks(): ChunkItem[] {
  const presets = getAllPresetChunks();
  saveChunks(presets);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
  return presets;
}

export function loadReviewLogs(): ReviewLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendReviewLog(log: ReviewLog): ReviewLog[] {
  const current = loadReviewLogs();
  const next = [log, ...current].slice(0, 200);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
  }
  return next;
}

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw
      ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) }
      : DEFAULT_USER_PROFILE;
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}
