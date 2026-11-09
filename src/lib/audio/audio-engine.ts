"use client";

/**
 * SEP Web Audio & Speech Engine
 * 1. 自然な英語音声合成 (1.0x / 1.2x 倍速制御、完了イベント同期)
 * 2. Web Audio API (AnalyserNode) によるミリ秒単位の Voice Onset (発話開始潜時) 検知
 * 3. Stage 3 向けの 0.5秒 (500ms) 以上のポーズ率・WPM リアルタイム計測
 * 4. Web Speech API (SpeechRecognition) によるリアルタイム音声文字起こし
 */

export function speakEnglishText(
  text: string,
  rate: number = 1.0,
  onEnd?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en-US") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Aria") ||
            v.name.includes("Guy") ||
            v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      onEnd?.();
      resolve();
    };

    utterance.onerror = () => {
      onEnd?.();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

export interface VoiceMetricsSnapshot {
  volumeLevel: number; // 0 - 100
  onsetLatencyMs: number | null;
  transcript: string;
  interimTranscript: string;
  pauseCountOver500ms: number;
  totalPauseDurationMs: number;
  elapsedMs: number;
  wpm: number;
}

export class VoiceSessionMonitor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private rafId: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  private startTimeMs: number = 0;
  private onsetLatencyMs: number | null = null;
  private hasSpoken: boolean = false;
  private consecutiveActiveFrames: number = 0;

  // Pause (>500ms) tracking
  private isCurrentlySilent: boolean = false;
  private silenceStartMs: number = 0;
  private pauseCountOver500ms: number = 0;
  private totalPauseDurationMs: number = 0;
  private currentPauseCounted: boolean = false;

  private finalTranscript: string = "";
  private interimTranscript: string = "";
  private isRunning: boolean = false;

  private onUpdate?: (snapshot: VoiceMetricsSnapshot) => void;
  private onVoiceOnset?: (latencyMs: number) => void;

  constructor(options?: {
    onUpdate?: (snapshot: VoiceMetricsSnapshot) => void;
    onVoiceOnset?: (latencyMs: number) => void;
  }) {
    this.onUpdate = options?.onUpdate;
    this.onVoiceOnset = options?.onVoiceOnset;
  }

  async start(referenceStartTimeMs?: number): Promise<boolean> {
    if (typeof window === "undefined") return false;
    this.stop();

    this.startTimeMs = referenceStartTimeMs ?? performance.now();
    this.onsetLatencyMs = null;
    this.hasSpoken = false;
    this.consecutiveActiveFrames = 0;
    this.isCurrentlySilent = false;
    this.silenceStartMs = 0;
    this.pauseCountOver500ms = 0;
    this.totalPauseDurationMs = 0;
    this.currentPauseCounted = false;
    this.finalTranscript = "";
    this.interimTranscript = "";
    this.isRunning = true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      this.startAudioLoop();
      this.startSpeechRecognition();
      return true;
    } catch (err) {
      console.warn("Microphone access unavailable or denied:", err);
      this.startSpeechRecognition();
      return false;
    }
  }

  private startAudioLoop() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    const VAD_RMS_THRESHOLD = 0.022; // 発話検知エネルギー閾値

    const tick = () => {
      if (!this.isRunning || !this.analyser) return;

      this.analyser.getFloatTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const volumeLevel = Math.min(100, Math.round(rms * 400));
      const now = performance.now();

      if (rms >= VAD_RMS_THRESHOLD) {
        this.consecutiveActiveFrames++;
        // 3フレーム連続で閾値を超えたら発話開始 (Voice Onset) と判定
        if (!this.hasSpoken && this.consecutiveActiveFrames >= 3) {
          this.hasSpoken = true;
          this.onsetLatencyMs = Math.max(
            80,
            Math.round(now - this.startTimeMs)
          );
          this.onVoiceOnset?.(this.onsetLatencyMs);
        }

        // 無音区間から有音に復帰した場合、直前のポーズ時間を確定
        if (this.isCurrentlySilent && this.hasSpoken) {
          const silenceDuration = now - this.silenceStartMs;
          if (silenceDuration >= 500) {
            this.totalPauseDurationMs += Math.round(silenceDuration);
          }
          this.isCurrentlySilent = false;
          this.currentPauseCounted = false;
        }
      } else {
        this.consecutiveActiveFrames = 0;
        // 発話開始後の無音区間（ポーズ）の計測
        if (this.hasSpoken) {
          if (!this.isCurrentlySilent) {
            this.isCurrentlySilent = true;
            this.silenceStartMs = now;
            this.currentPauseCounted = false;
          } else {
            const currentSilenceDuration = now - this.silenceStartMs;
            if (currentSilenceDuration >= 500 && !this.currentPauseCounted) {
              this.pauseCountOver500ms++;
              this.currentPauseCounted = true;
            }
          }
        }
      }

      this.emitSnapshot(volumeLevel, now);
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private startSpeechRecognition() {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    try {
      this.recognition = new SpeechRecognitionCtor();
      this.recognition.lang = "en-US";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        if (!this.hasSpoken) {
          this.hasSpoken = true;
          this.onsetLatencyMs = Math.max(
            120,
            Math.round(performance.now() - this.startTimeMs)
          );
          this.onVoiceOnset?.(this.onsetLatencyMs);
        }

        let finalStr = "";
        let interimStr = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + " ";
          } else {
            interimStr += res[0].transcript;
          }
        }
        this.finalTranscript = finalStr.trim();
        this.interimTranscript = interimStr.trim();
        this.emitSnapshot(0, performance.now());
      };

      this.recognition.onerror = () => {
        // ブラウザの音声認識エラー時は静かに継続
      };

      this.recognition.onend = () => {
        if (this.isRunning && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // ignore restart error
          }
        }
      };

      this.recognition.start();
    } catch {
      // SpeechRecognition unsupported
    }
  }

  private emitSnapshot(volumeLevel: number, now: number) {
    const elapsedMs = Math.max(1, Math.round(now - this.startTimeMs));
    const combinedTranscript = `${this.finalTranscript} ${this.interimTranscript}`.trim();
    const wordCount = combinedTranscript
      ? combinedTranscript.split(/\s+/).filter(Boolean).length
      : 0;
    const elapsedMinutes = elapsedMs / 60000;
    const wpm = elapsedMinutes > 0.03 ? Math.round(wordCount / elapsedMinutes) : 0;

    // 現在継続中の500ms以上のポーズも合算してリアルタイム表示
    let ongoingPauseMs = 0;
    if (this.hasSpoken && this.isCurrentlySilent) {
      const currentSilence = now - this.silenceStartMs;
      if (currentSilence >= 500) {
        ongoingPauseMs = Math.round(currentSilence);
      }
    }

    this.onUpdate?.({
      volumeLevel,
      onsetLatencyMs: this.onsetLatencyMs,
      transcript: combinedTranscript,
      interimTranscript: this.interimTranscript,
      pauseCountOver500ms: this.pauseCountOver500ms,
      totalPauseDurationMs: this.totalPauseDurationMs + ongoingPauseMs,
      elapsedMs,
      wpm,
    });
  }

  stop(): VoiceMetricsSnapshot {
    this.isRunning = false;
    const now = performance.now();

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    const elapsedMs = Math.max(1, Math.round(now - this.startTimeMs));
    const combinedTranscript = `${this.finalTranscript} ${this.interimTranscript}`.trim();
    const wordCount = combinedTranscript
      ? combinedTranscript.split(/\s+/).filter(Boolean).length
      : 0;
    const wpm = Math.round(wordCount / (elapsedMs / 60000));

    return {
      volumeLevel: 0,
      onsetLatencyMs: this.onsetLatencyMs,
      transcript: combinedTranscript,
      interimTranscript: this.interimTranscript,
      pauseCountOver500ms: this.pauseCountOver500ms,
      totalPauseDurationMs: this.totalPauseDurationMs,
      elapsedMs,
      wpm,
    };
  }
}
