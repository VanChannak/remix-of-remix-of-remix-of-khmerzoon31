-- Create watch_history table to track user viewing progress
create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  episode_id uuid references public.episodes(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  progress numeric not null default 0, -- Progress in seconds
  duration numeric not null default 0, -- Total duration in seconds
  completed boolean not null default false,
  last_watched_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint episode_or_movie_check check (
    (episode_id is not null and movie_id is null) or
    (episode_id is null and movie_id is not null)
  )
);

-- Enable RLS
alter table public.watch_history enable row level security;

-- Users can view their own watch history
create policy "Users can view own watch history"
on public.watch_history
for select
to authenticated
using (auth.uid() = user_id);

-- Users can insert their own watch history
create policy "Users can insert own watch history"
on public.watch_history
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can update their own watch history
create policy "Users can update own watch history"
on public.watch_history
for update
to authenticated
using (auth.uid() = user_id);

-- Create index for faster queries
create index idx_watch_history_user_episode on public.watch_history(user_id, episode_id);
create index idx_watch_history_user_movie on public.watch_history(user_id, movie_id);
create index idx_watch_history_last_watched on public.watch_history(user_id, last_watched_at desc);

-- Create trigger for updated_at
create trigger update_watch_history_updated_at
before update on public.watch_history
for each row
execute function public.update_updated_at_column();