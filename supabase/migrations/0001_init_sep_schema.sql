-- SEP (Speed & Elaboration Pipeline) Database Schema for Supabase PostgreSQL

create extension if not exists "uuid-ossp";

-- 1. User Profiles (自己参照文脈生成用の専門分野・関心領域を保持)
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null default '西門',
  specialty_domains text[] not null default array['ソフトウェアエンジニアリング', 'AI・LLMシステム設計', 'プロダクトマネジメント', '認知科学'],
  target_wpm integer not null default 140,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Chunks (4ステージ昇格 & FSRS状態管理)
create table if not exists public.chunks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  raw_input text not null,
  chunk_text text not null,
  meaning_ja text not null,
  stage smallint not null default 1 check (stage between 0 and 3),
  stability double precision not null default 1.0,
  difficulty double precision not null default 5.0,
  reps integer not null default 0,
  lapses integer not null default 0,
  last_latency_ms integer,
  best_latency_ms integer,
  last_review timestamptz,
  next_review timestamptz not null default now(),
  elaboration jsonb not null default '{}'::jsonb,
  audio_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chunks_stage_next_review on public.chunks(stage, next_review);

-- 3. Review Logs (ミリ秒反応潜時 & FSRS履歴)
create table if not exists public.review_logs (
  id uuid primary key default uuid_generate_v4(),
  chunk_id uuid not null references public.chunks(id) on delete cascade,
  stage_at_review smallint not null,
  input_mode text not null check (input_mode in ('voice', 'typing')),
  is_correct boolean not null,
  latency_ms integer not null,
  fsrs_rating smallint not null check (fsrs_rating between 1 and 4),
  stability_before double precision not null,
  stability_after double precision not null,
  stage_before smallint not null,
  stage_after smallint not null,
  reviewed_at timestamptz not null default now()
);

-- 4. Stage 2 Sessions (既知語率98%の200語多読 & マイクロディクテーション & 短文生成)
create table if not exists public.stage2_sessions (
  id uuid primary key default uuid_generate_v4(),
  target_chunk_ids uuid[] not null,
  passage_title text not null,
  passage_text text not null,
  passage_translation_ja text not null,
  dictation_items jsonb not null default '[]'::jsonb,
  dictation_score double precision,
  user_sentences jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Stage 3 Sprints (AI音声反駁 & 90/60/45秒 圧縮スプリント & 語彙高度化スコア)
create table if not exists public.stage3_sprints (
  id uuid primary key default uuid_generate_v4(),
  required_chunk_ids uuid[] not null,
  topic text not null,
  ai_counter_argument text not null,
  ai_counter_ja text not null,
  rounds jsonb not null default '[]'::jsonb,
  best_wpm double precision,
  lowest_pause_rate double precision,
  lexical_sophistication_score double precision,
  created_at timestamptz not null default now()
);
