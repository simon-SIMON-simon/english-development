export type StageNumber = 0 | 1 | 2 | 3;

export type FSRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type LearningSetId = "PEL" | "ACL" | "AFL" | "PVPL" | "CUSTOM";

export interface LearningSetMeta {
  id: LearningSetId;
  name: string;
  nameJa: string;
  descriptionJa: string;
  academicCitation: string;
  badgeColor: string;
  itemCount: number;
}

export interface ChunkEtymology {
  prefix: string;
  root: string;
  nuance: string;
}

export interface SelfReferenceContext {
  domain: string;
  exampleEn: string;
  exampleJa: string;
}

export interface PhoneticNotes {
  ipa: string;
  linkingAndWeakForms: string;
}

export interface ChunkElaboration {
  candidates?: {
    chunkText: string;
    meaningJa: string;
    register: string;
  }[];
  etymology: ChunkEtymology;
  visualImage: string;
  selfReference: SelfReferenceContext;
  phonetics: PhoneticNotes;
}

export interface ChunkItem {
  id: string;
  rawInput: string;
  chunkText: string;
  meaningJa: string;
  stage: StageNumber;
  sourceSet?: LearningSetId;
  stability: number; // FSRS S (記憶安定度: 日数)
  difficulty: number; // FSRS D (1.0 - 10.0)
  reps: number;
  lapses: number;
  lastLatencyMs?: number;
  bestLatencyMs?: number;
  lastReview?: string;
  nextReview: string;
  elaboration: ChunkElaboration;
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  chunkId: string;
  chunkText: string;
  stageAtReview: StageNumber;
  inputMode: "voice" | "typing";
  isCorrect: boolean;
  latencyMs: number;
  fsrsRating: FSRSRating;
  stabilityBefore: number;
  stabilityAfter: number;
  stageBefore: StageNumber;
  stageAfter: StageNumber;
  reviewedAt: string;
}

export interface DictationBlank {
  id: string;
  targetPhrase: string;
  phoneticHint: string; // e.g., "/biːjɪnstrəˈmɛntl ɪn/ (be_instrumental_in の母音連結)"
  reason: string;
}

export interface SentenceFeedback {
  chunkId: string;
  chunkText: string;
  userSentence: string;
  isNatural: boolean;
  collocationScore: number; // 0-100
  correctedSentence: string;
  explanationJa: string;
  upgradedAlternative: string;
}

export interface Stage2PassageData {
  title: string;
  passageText: string; // 200 words, 98% known vocabulary
  translationJa: string;
  knownWordRatioEstimate: number;
  targetChunksUsed: string[];
  dictationBlanks: DictationBlank[];
}

export interface SprintRoundResult {
  roundNumber: 1 | 2 | 3;
  timeLimitSec: 90 | 60 | 45;
  durationSec: number;
  transcript: string;
  wordCount: number;
  wpm: number;
  pauseCountOver500ms: number;
  totalPauseDurationMs: number;
  pauseRatioPercent: number;
  usedChunks: string[];
  missingChunks: string[];
}

export interface Stage3EvaluationResult {
  lexicalSophisticationScore: number; // 0-100
  cafScores: {
    complexity: number;
    accuracy: number;
    fluency: number;
  };
  basicWordEscapes: {
    usedBasicExpression: string;
    sophisticatedReplacement: string;
    reasonJa: string;
  }[];
  overallCritiqueJa: string;
  modelCounterResponseEn: string;
}

export interface UserProfile {
  displayName: string;
  specialtyDomains: string[];
  targetWpm: number;
  geminiApiKey?: string;
}
