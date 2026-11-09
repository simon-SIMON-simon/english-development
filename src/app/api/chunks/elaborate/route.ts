import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rawInput,
      userName = "西門",
      specialtyDomains = ["ソフトウェアアーキテクチャ・AI開発", "プロダクト戦略"],
      apiKey,
    } = body as {
      rawInput: string;
      userName?: string;
      specialtyDomains?: string[];
      apiKey?: string;
    };

    const trimmed = (rawInput || "").trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "単語またはフレーズを入力してください。" },
        { status: 400 }
      );
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const prompt = `あなたは第二言語習得論（チャンク化・二重符号化・精緻化・音声知覚）の専門AIコーチです。
TOEIC 935点の上級者である「${userName}」（専門・関心領域: ${specialtyDomains.join("、")}）が、以下の単語・表現を受容語彙から「3秒以内に引き出せる発表語彙チャンク」へ昇華させるためのデータを作成してください。

入力語彙: "${trimmed}"

【厳守ルール】
1. 単体単語ではなく、ネイティブが実際の知的議論・ビジネスで高頻度に使う **3〜5語の自然なコロケーション（共起表現）** に変換すること（例: raise grave concerns over, be instrumental in, strike a delicate balance between）。
2. 語源（接頭辞・語根・コアイメージ）を分解し、類義語とのニュアンス差を明記すること。
3. 脳内に鮮明な映像が浮かぶ「視覚的イメージ」を描写すること。
4. ${userName}の専門領域（${specialtyDomains[0] || "AI・ソフトウェア開発"}）に直結する「自己参照例文（英語＋自然な日本語訳）」を作成すること。
5. リスニング知覚を自動化する「IPA発音記号」と「リンキング・弱形・脱落（フラッピングやストップTなど）の具体解説」を含めること。`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                chunkText: {
                  type: Type.STRING,
                  description: "3〜5語の最優先コロケーション（英語）",
                },
                meaningJa: {
                  type: Type.STRING,
                  description: "Stage 1の検索トリガーになる簡潔で的確な日本語概念",
                },
                candidates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      chunkText: { type: Type.STRING },
                      meaningJa: { type: Type.STRING },
                      register: { type: Type.STRING },
                    },
                    required: ["chunkText", "meaningJa", "register"],
                  },
                },
                etymology: {
                  type: Type.OBJECT,
                  properties: {
                    prefix: { type: Type.STRING },
                    root: { type: Type.STRING },
                    nuance: { type: Type.STRING },
                  },
                  required: ["prefix", "root", "nuance"],
                },
                visualImage: { type: Type.STRING },
                selfReference: {
                  type: Type.OBJECT,
                  properties: {
                    domain: { type: Type.STRING },
                    exampleEn: { type: Type.STRING },
                    exampleJa: { type: Type.STRING },
                  },
                  required: ["domain", "exampleEn", "exampleJa"],
                },
                phonetics: {
                  type: Type.OBJECT,
                  properties: {
                    ipa: { type: Type.STRING },
                    linkingAndWeakForms: { type: Type.STRING },
                  },
                  required: ["ipa", "linkingAndWeakForms"],
                },
              },
              required: [
                "chunkText",
                "meaningJa",
                "candidates",
                "etymology",
                "visualImage",
                "selfReference",
                "phonetics",
              ],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return NextResponse.json({
            ...parsed,
            source: "gemini",
          });
        }
      } catch (err) {
        console.warn("Gemini API fallback triggered:", err);
      }
    }

    // --- ローカル即時推論エンジン (APIキー未設定時も完全動作) ---
    const wordCount = trimmed.split(/\s+/).length;
    const primaryDomain =
      specialtyDomains[0] || "ソフトウェアアーキテクチャ・AI開発";

    // 入力が1〜2語の場合は3〜5語のコロケーションへ自動拡張
    const builtChunk =
      wordCount >= 3
        ? trimmed
        : `play a pivotal role in ${trimmed.replace(/^to\s+/i, "")}`;

    const fallbackChunk =
      trimmed.toLowerCase() === "mitigate"
        ? "mitigate the potential risks of"
        : trimmed.toLowerCase() === "leverage"
        ? "fully leverage the strengths of"
        : trimmed.toLowerCase() === "bottleneck"
        ? "alleviate the bottleneck in"
        : trimmed.toLowerCase() === "scrutiny"
        ? "come under intense scrutiny"
        : trimmed.toLowerCase() === "catalyst"
        ? "act as a catalyst for"
        : trimmed.toLowerCase() === "compelling"
        ? "make a compelling case for"
        : wordCount >= 3
        ? trimmed
        : `make full use of ${trimmed}`;

    const fallbackMeaning =
      trimmed.toLowerCase() === "mitigate"
        ? "〜の潜在的なリスクを軽減・緩和する"
        : trimmed.toLowerCase() === "leverage"
        ? "〜の強みを最大限に活用する（てこ入れする）"
        : trimmed.toLowerCase() === "catalyst"
        ? "〜を加速させる触媒（起爆剤）として働く"
        : trimmed.toLowerCase() === "compelling"
        ? "〜について有無を言わせぬ説得力のある論拠を示す"
        : `「${trimmed}」を核とした実践的チャンク表現`;

    return NextResponse.json({
      chunkText: fallbackChunk,
      meaningJa: fallbackMeaning,
      candidates: [
        {
          chunkText: fallbackChunk,
          meaningJa: fallbackMeaning,
          register: "知的議論・ビジネス全般 (最推奨)",
        },
        {
          chunkText: builtChunk,
          meaningJa: `${trimmed}において中枢的な役割を果たす`,
          register: "プレゼン・戦略会議",
        },
      ],
      etymology: {
        prefix: "共起構造 (Collocation Frame)",
        root: `Core: "${trimmed}"`,
        nuance: `単体語「${trimmed}」として暗記するのではなく、前後の動詞・前置詞とセットの3〜5語チャンク『${fallbackChunk}』として手続き記憶化することで、発話時の文法組み立て負荷をゼロにします。`,
      },
      visualImage: `「${fallbackChunk}」が一つの連結した光のブロックとして脳内から3秒以内に飛び出し、議論の核心を射抜くイメージ`,
      selfReference: {
        domain: primaryDomain,
        exampleEn: `In our latest architecture review, we decided to ${fallbackChunk} the new AI pipeline.`,
        exampleJa: `${userName}の最新アーキテクチャレビューにおいて、新しいAIパイプラインに「${fallbackChunk}」を適用する意思決定を行った。`,
      },
      phonetics: {
        ipa: `/${fallbackChunk.toLowerCase()}/`,
        linkingAndWeakForms:
          "機能語（冠詞 a/the や前置詞 of/in/for）は強く発音せず弱形（シュワー /ə/）にし、直前の内容語の子音とリエゾンさせて一息のチャンクとして発音します。",
      },
      source: "local-engine",
    });
  } catch (error) {
    console.error("Elaborate error:", error);
    return NextResponse.json(
      { error: "精緻化データの生成中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
