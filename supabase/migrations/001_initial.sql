create extension if not exists "pgcrypto";

create type reading_status as enum ('WANT_TO_READ','READING','FINISHED','PAUSED');
create type reading_source as enum ('WECHAT_READING','KINDLE','PAPER','OTHER');

create table books (
  id uuid primary key default gen_random_uuid(), title text not null, subtitle text,
  author text, cover_url text, description text, publisher text, publish_year integer,
  isbn text, total_pages integer check (total_pages is null or total_pages > 0),
  toc_json jsonb, metadata_source text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table reading_sessions (
  id uuid primary key default gen_random_uuid(), book_id uuid not null references books(id) on delete cascade,
  status reading_status not null default 'WANT_TO_READ', reading_source reading_source not null default 'OTHER',
  started_at date, finished_at date, current_page integer check (current_page is null or current_page >= 0),
  current_chapter text, user_reflection text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table progress_logs (
  id uuid primary key default gen_random_uuid(), reading_session_id uuid not null references reading_sessions(id) on delete cascade,
  log_date date not null default current_date, page_number integer check (page_number is null or page_number >= 0), chapter_text text, created_at timestamptz not null default now()
);

create table book_topics (
  id uuid primary key default gen_random_uuid(), book_id uuid not null references books(id) on delete cascade,
  topic text not null, normalized_topic text not null, confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)), source text, generated_at timestamptz not null default now()
);

create table ai_reading_notes (
  id uuid primary key default gen_random_uuid(), reading_session_id uuid not null references reading_sessions(id) on delete cascade,
  one_sentence_summary text, core_points_json jsonb, reading_notes text, insights_json jsonb,
  user_edited boolean not null default false, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table posters (
  id uuid primary key default gen_random_uuid(), reading_session_id uuid not null references reading_sessions(id) on delete cascade,
  background_image_url text, final_image_url text, prompt_snapshot text, layout_version text not null default 'v1', created_at timestamptz not null default now()
);

create table ai_job_logs (
  id uuid primary key default gen_random_uuid(), job_type text not null, target_type text not null, target_id uuid,
  provider text, model text, input_snapshot jsonb, output_snapshot jsonb, status text not null, error_message text,
  created_at timestamptz not null default now(), completed_at timestamptz
);

create index reading_sessions_book_id_idx on reading_sessions(book_id);
create index reading_sessions_status_idx on reading_sessions(status);
create index reading_sessions_finished_at_idx on reading_sessions(finished_at);
create index progress_logs_session_date_idx on progress_logs(reading_session_id, log_date desc);
create index book_topics_normalized_idx on book_topics(normalized_topic);

create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger books_updated_at before update on books for each row execute function set_updated_at();
create trigger reading_sessions_updated_at before update on reading_sessions for each row execute function set_updated_at();
create trigger ai_reading_notes_updated_at before update on ai_reading_notes for each row execute function set_updated_at();
