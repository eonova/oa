create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id text primary key,
  name text not null,
  permissions text[] not null default '{}'
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  department text not null,
  owner text not null,
  status text not null check (status in ('todo', 'doing', 'done')),
  priority text not null check (priority in ('high', 'normal', 'low')),
  due_date date not null,
  amount integer not null default 0,
  updated_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  record_id uuid references public.records(id) on delete cascade,
  receiver_id uuid references public.app_users(id) on delete cascade,
  status text not null default 'unread' check (status in ('unread', 'read', 'handled')),
  created_at timestamptz not null default now()
);

create table if not exists public.review_tasks (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references public.records(id) on delete cascade,
  assignee_id uuid references public.app_users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'transferred')),
  comment text not null default '',
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.records enable row level security;
alter table public.notifications enable row level security;
alter table public.review_tasks enable row level security;

create policy "authenticated users can read app users"
  on public.app_users for select
  to authenticated
  using (true);

create policy "authenticated users can read roles"
  on public.roles for select
  to authenticated
  using (true);

create policy "authenticated users can read records"
  on public.records for select
  to authenticated
  using (true);

create policy "authenticated users can manage records"
  on public.records for all
  to authenticated
  using (true)
  with check (true);

create policy "users can read own notifications"
  on public.notifications for select
  to authenticated
  using (true);

create policy "authenticated users can manage notifications"
  on public.notifications for all
  to authenticated
  using (true)
  with check (true);

create policy "users can read review tasks"
  on public.review_tasks for select
  to authenticated
  using (true);

create policy "authenticated users can manage review tasks"
  on public.review_tasks for all
  to authenticated
  using (true)
  with check (true);

insert into public.roles (id, name, permissions)
values
  ('admin', '管理员', array[
    'dashboard.view',
    'records.view',
    'records.create',
    'records.update',
    'records.delete',
    'records.export',
    'users.manage',
    'roles.manage',
    'notifications.receive',
    'reviews.approve'
  ]),
  ('operator', '经办人', array[
    'dashboard.view',
    'records.view',
    'records.create',
    'records.update',
    'records.export',
    'notifications.receive',
    'reviews.approve'
  ]),
  ('viewer', '只读用户', array[
    'dashboard.view',
    'records.view',
    'notifications.receive'
  ])
on conflict (id) do update
set name = excluded.name,
    permissions = excluded.permissions;
