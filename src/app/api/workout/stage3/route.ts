import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { SprintRoundResult } from "@/types/sep";

const BASIC_ESCAPE_WORDS: Record<
  string,
  { replacement: string; reasonJa: string }
> = {
  "very important": {
    replacement: "pivotal / instrumental / paramount",
    reasonJa:
      "「very important」という基礎語彙への逃げを検出し、C1レベルの形容詞または be instrumental in への昇格を推奨します。",
  },
  important: {
    replacement: "crucial / indispensable",
    reasonJa:
      "important の多用を避け、不可欠性を表す indispensable や crucial に置き換えると議論の説得力が跳ね上がります。",
  },
  "good result": {
    replacement: "tangible results / substantial outcomes",
    reasonJa:
      "good result の代わりに yield tangible results（目に見える成果を生む）を使うことで知的な響きになります。",
  },
  "bad effect": {
    replacement: "detrimental impact / adverse effect",
    reasonJa:
      "bad effect は受容語彙レベルの表現です。detrimental impact や at the expense of を使いましょう。",
  },
  "i think": {
    replacement: "I am convinced that / The evidence suggests that",
    reasonJa:
      "ディベートでの I think 連発は主張を弱めます。確信度や客観的根拠を示すチャンクで切り出しましょう。",
  },
  "make sure": {
    replacement: "ensure / guarantee",
    reasonJa:
      "口語の基本表現 make sure を ensure や take into full account に引き上げると洗練されます。",
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      requiredChunks = [],
      specialtyDomains = ["ソフトウェアアーキテクチャ・AI開発", "認知科学"],
      aiCounterArgument,
      rounds = [],
    } = body as {
      action: "generate_counter" | "evaluate_sprint";
      requiredChunks?: string[];
      specialtyDomains?: string[];
      aiCounterArgument?: string;
      rounds?: SprintRoundResult[];
    };

    // セキュリティ設計: APIキーはサーバーサイドの環境変数 (.env.local) からのみ参照
    const effectiveKey = process.env.GEMINI_API_KEY?.trim();

    // =========================================================================
    // Action 1: AI音声反駁（カウンター）の生成
    // =========================================================================
    if (action === "generate_counter") {
      if (effectiveKey && requiredChunks.length > 0) {
        try {
          const ai = new GoogleGenAI({ apiKey: effectiveKey });
          const prompt = `あなたは知的ディベートの対戦相手AIです。
ユーザーの専門領域（${specialtyDomains.join("、")}）に関する鋭い反論・挑発的な質問を英語（約50〜70語）で投げかけてください。
ユーザーは以下の指定チャンクをすべて使ってあなたに言い返す必要があります：
指定チャンク: ${requiredChunks.join(", ")}`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  aiCounterArgument: { type: Type.STRING },
                  aiCounterJa: { type: Type.STRING },
                  hintStrategyJa: { type: Type.STRING },
                },
                required: [
                  "topic",
                  "aiCounterArgument",
                  "aiCounterJa",
                  "hintStrategyJa",
                ],
              },
            },
          });

          if (response.text) {
            return NextResponse.json(JSON.parse(response.text));
          }
        } catch (err) {
          console.warn("Stage 3 counter fallback:", err);
        }
      }

      return NextResponse.json({
        topic: "Speed vs. Architectural Quality in AI Development",
        aiCounterArgument:
          "Honestly, spending weeks designing clean software architecture or refining advanced vocabulary seems unnecessary today. Why not just ship fast prototypes with basic tools and fix problems later when users complain?",
        aiCounterJa:
          "「正直なところ、今日において堅牢なソフトウェア設計や高度な語彙の洗練に何週間も費やすのは不要に思えます。基本的なツールでとにかく素早くプロトタイプを出荷し、ユーザーから不満が出た後で直せばよいのではありませんか？」",
        hintStrategyJa: `指定チャンク（${requiredChunks.join(" / ")}）をすべて使い、「短期的な速度ばかりを追求すると長期的な品質を犠牲にする（at the expense of）」「安易なやり方はすぐに収穫逓減に達する（reach a point of diminishing returns）」という論理軸で即座に反駁してください。`,
      });
    }

    // =========================================================================
    // Action 2: 90s → 60s → 45s 圧縮スプリントの評価 & 語彙高度化スコア算出
    // =========================================================================
    if (action === "evaluate_sprint") {
      const latestRound = rounds[rounds.length - 1];
      const allTranscripts = rounds.map((r) => r.transcript).join(" ");

      if (effectiveKey && latestRound) {
        try {
          const ai = new GoogleGenAI({ apiKey: effectiveKey });
          const prompt = `あなたはCAF仮説（Complexity, Accuracy, Fluency）および語彙高度化（Lexical Sophistication）の評価専門AIです。

AIの反論: "${aiCounterArgument}"
強制使用チャンク: ${requiredChunks.join(", ")}
全ラウンド計測結果:
${rounds
  .map(
    (r) =>
      `Round ${r.roundNumber} (${r.timeLimitSec}s): WPM=${r.wpm}, ポーズ率=${r.pauseRatioPercent}%, 使用チャンク=${r.usedChunks.join(",")}, 発話="${r.transcript}"`
  )
  .join("\n")}

安全な基礎語彙（good, bad, important, I think, make sure 等）に逃げていないかを厳しく判定し、語彙高度化スコア（0〜100）とリフレーズ提案、模範反駁英文を出力してください。`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  lexicalSophisticationScore: { type: Type.NUMBER },
                  cafScores: {
                    type: Type.OBJECT,
                    properties: {
                      complexity: { type: Type.NUMBER },
                      accuracy: { type: Type.NUMBER },
                      fluency: { type: Type.NUMBER },
                    },
                    required: ["complexity", "accuracy", "fluency"],
                  },
                  basicWordEscapes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        usedBasicExpression: { type: Type.STRING },
                        sophisticatedReplacement: { type: Type.STRING },
                        reasonJa: { type: Type.STRING },
                      },
                      required: [
                        "usedBasicExpression",
                        "sophisticatedReplacement",
                        "reasonJa",
                      ],
                    },
                  },
                  overallCritiqueJa: { type: Type.STRING },
                  modelCounterResponseEn: { type: Type.STRING },
                },
                required: [
                  "lexicalSophisticationScore",
                  "cafScores",
                  "basicWordEscapes",
                  "overallCritiqueJa",
                  "modelCounterResponseEn",
                ],
              },
            },
          });

          if (response.text) {
            return NextResponse.json(JSON.parse(response.text));
          }
        } catch (err) {
          console.warn("Stage 3 eval fallback:", err);
        }
      }

      // ローカルCAF・語彙高度化算出エンジン
      const lowerText = allTranscripts.toLowerCase();
      const detectedEscapes: {
        usedBasicExpression: string;
        sophisticatedReplacement: string;
        reasonJa: string;
      }[] = [];

      for (const [basicExpr, info] of Object.entries(BASIC_ESCAPE_WORDS)) {
        if (lowerText.includes(basicExpr)) {
          detectedEscapes.push({
            usedBasicExpression: basicExpr,
            sophisticatedReplacement: info.replacement,
            reasonJa: info.reasonJa,
          });
        }
      }

      const bestWpm = Math.max(...rounds.map((r) => r.wpm), 0);
      const lowestPause = Math.min(
        ...rounds.map((r) => r.pauseRatioPercent),
        100
      );
      const chunkUsageRatio =
        requiredChunks.length > 0 && latestRound
          ? latestRound.usedChunks.length / requiredChunks.length
          : 0.8;

      const complexity = Math.min(
        98,
        Math.round(chunkUsageRatio * 75 + Math.max(0, 25 - detectedEscapes.length * 6))
      );
      const fluency = Math.min(
        98,
        Math.round(Math.min(100, (bestWpm / 135) * 70) + Math.max(0, 30 - lowestPause))
      );
      const accuracy = Math.min(96, Math.round((complexity + fluency) / 2));
      const lexicalSophisticationScore = Math.round(
        complexity * 0.65 + accuracy * 0.35
      );

      const c0 = requiredChunks[0] || "at the expense of";
      const c1 = requiredChunks[1] || "remain a viable option for";
      const c2 = requiredChunks[2] || "reach a point of diminishing returns";

      return NextResponse.json({
        lexicalSophisticationScore,
        cafScores: {
          complexity,
          accuracy,
          fluency,
        },
        basicWordEscapes:
          detectedEscapes.length > 0
            ? detectedEscapes
            : [
                {
                  usedBasicExpression: "基礎語彙への逃げなし (Excellent Control)",
                  sophisticatedReplacement: requiredChunks.join(" / "),
                  reasonJa:
                    "時間制限のプレッシャー下でも安易な基礎語彙に逃げず、ターゲットチャンクを正確に駆動できています。",
                },
              ],
        overallCritiqueJa: `圧縮スプリント（90秒→60秒→45秒）を通じて、最高WPM ${bestWpm}・最小ポーズ率 ${lowestPause}% を記録しました。時間制限が厳しくなるRound 3において、指定チャンクを手続き記憶として引き出せているかがプラトー打破の鍵です。`,
        modelCounterResponseEn: `While shipping prototypes quickly can be useful early on, pursuing speed ${c0} architectural integrity is dangerous. Ad-hoc fixes quickly ${c2} as system complexity grows. Therefore, investing in clean design and precise collocations must ${c1} any team aiming for sustainable excellence.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Stage 3 API error:", error);
    return NextResponse.json(
      { error: "Stage 3 処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
