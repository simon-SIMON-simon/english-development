import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEP — Speed & Elaboration Pipeline | 上級者向け英語自動化トレーナー",
  description:
    "TOEIC 935点からのプラトー打破。FSRS×3000ms反応潜時と4ステージ昇格パイプラインによる高速音声知覚・スピーキング自動化Webアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
