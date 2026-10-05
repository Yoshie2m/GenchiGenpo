-- 最初のスキーマ。ARCHITECTURE.md「データ永続化（DB）設計」の決定（案B）をそのまま反映する。
-- 表形式のもの（members・daily_steps・personal_missions系・candidate_order）は正規化し、
-- チームミッションは team_mission_state に JSONB + 版番号（楽観的ロック）で保存する。

-- members: auth.users.id をそのまま使う（メンバー登録＝ログインアカウントの作成と1対1）。
create table members (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  registered_date date not null
);

alter table members enable row level security;

create policy "members は認証済みなら誰でも読める" on members for select to authenticated
using (true);

create policy "members は本人だけ書ける" on members for insert to authenticated
with check (auth.uid () = id);

create policy "members は本人だけ更新できる" on members for update to authenticated
using (auth.uid () = id)
with check (auth.uid () = id);

-- daily_steps: メンバー×日付ごとの日次合計歩数。1日30,000歩を上限とする（手入力・画面キャプチャの水増し対策）。
create table daily_steps (
  member_id uuid not null references members (id) on delete cascade,
  date date not null,
  steps integer not null check (steps between 0 and 30000),
  source text not null check (source in ('manual', 'iosShortcut', 'screenCapture')),
  reflected_at timestamptz not null,
  primary key (member_id, date)
);

alter table daily_steps enable row level security;

create policy "daily_steps は認証済みなら誰でも読める" on daily_steps for select to authenticated
using (true);

create policy "daily_steps は本人だけ書ける" on daily_steps for insert to authenticated
with check (auth.uid () = member_id);

create policy "daily_steps は本人だけ更新できる" on daily_steps for update to authenticated
using (auth.uid () = member_id)
with check (auth.uid () = member_id);

-- personal_missions 系: 個人ミッション（PersonalMissionSnapshot）をそのまま反映。
-- 個人ミッションの属性は DOMAINS.md 上まだ【仮】のため、確定したら見直す。
create table personal_missions (
  member_id uuid primary key references members (id) on delete cascade,
  start_date date not null
);

create table personal_mission_steps (
  member_id uuid not null references members (id) on delete cascade,
  date date not null,
  steps integer not null,
  primary key (member_id, date)
);

create table personal_mission_arrivals (
  member_id uuid not null references members (id) on delete cascade,
  checkpoint_index integer not null,
  arrived_at timestamptz not null,
  primary key (member_id, checkpoint_index)
);

alter table personal_missions enable row level security;

alter table personal_mission_steps enable row level security;

alter table personal_mission_arrivals enable row level security;

create policy "personal_missions は認証済みなら誰でも読める" on personal_missions for select to authenticated
using (true);

create policy "personal_missions は本人だけ書ける" on personal_missions for insert to authenticated
with check (auth.uid () = member_id);

create policy "personal_missions は本人だけ更新できる" on personal_missions for update to authenticated
using (auth.uid () = member_id)
with check (auth.uid () = member_id);

create policy "personal_mission_steps は認証済みなら誰でも読める" on personal_mission_steps for select to authenticated
using (true);

create policy "personal_mission_steps は本人だけ書ける" on personal_mission_steps for insert to authenticated
with check (auth.uid () = member_id);

create policy "personal_mission_steps は本人だけ更新できる" on personal_mission_steps for update to authenticated
using (auth.uid () = member_id)
with check (auth.uid () = member_id);

create policy "personal_mission_arrivals は認証済みなら誰でも読める" on personal_mission_arrivals for select to authenticated
using (true);

create policy "personal_mission_arrivals は本人だけ書ける" on personal_mission_arrivals for insert to authenticated
with check (auth.uid () = member_id);

create policy "personal_mission_arrivals は本人だけ更新できる" on personal_mission_arrivals for update to authenticated
using (auth.uid () = member_id)
with check (auth.uid () = member_id);

-- candidate_order: 候補の中身はマスターデータ（コード）のまま、保存するのは並び順だけ。
create table candidate_order (
  candidate_id text primary key,
  sort_order integer not null unique
);

alter table candidate_order enable row level security;

create policy "candidate_order は認証済みなら誰でも読める" on candidate_order for select to authenticated
using (true);

create policy "candidate_order は認証済みなら誰でも書ける" on candidate_order for insert to authenticated
with check (true);

create policy "candidate_order は認証済みなら誰でも更新できる" on candidate_order for update to authenticated
using (true)
with check (true);

-- team_mission_state: 単一行。チームミッションは全体で同時に1つの流れしか進行しない。
-- tick() はどのクライアントが実行してもよい前提のため、書き込みは認証済みなら誰でも可にする。
-- 保存は `update ... set state = :new, version = version + 1 where id = 1 and version = :expected`
-- の形にし、更新行数が0なら読み直して再試行する（楽観的ロック）。
create table team_mission_state (
  id integer primary key default 1 check (id = 1),
  state jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now ()
);

alter table team_mission_state enable row level security;

create policy "team_mission_state は認証済みなら誰でも読める" on team_mission_state for select to authenticated
using (true);

create policy "team_mission_state は認証済みなら誰でも書ける" on team_mission_state for insert to authenticated
with check (true);

create policy "team_mission_state は認証済みなら誰でも更新できる" on team_mission_state for update to authenticated
using (true)
with check (true);
