-- TailStake MVP Schema
-- Aircraft co-ownership formation + click-wrap signing

-- gen_random_uuid() is built into Postgres 13+ (Supabase default)

-- Syndicates (the co-ownership group)
create table syndicates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aircraft_tail_number text not null,
  aircraft_type text not null,
  aircraft_value numeric(12,2) not null check (aircraft_value > 0),
  home_airfield text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'dissolved')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Members (cap table)
create table members (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references syndicates(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  email text not null,
  phone text,
  ownership_bps integer not null check (ownership_bps > 0 and ownership_bps < 10000),
  role text not null default 'member' check (role in ('initiator', 'member')),
  joined_at timestamptz,
  unique(syndicate_id, email)
);

-- Invitations (token-based, decoupled from magic link expiry)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references syndicates(id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

-- Agreements (formation documents with canonical terms)
create table agreements (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references syndicates(id) on delete cascade,
  type text not null default 'formation' check (type in ('formation', 'amendment', 'transfer')),
  version integer not null default 1,
  terms jsonb not null default '{}',
  pdf_url text,
  status text not null default 'draft' check (status in ('draft', 'pending_signatures', 'signed')),
  created_at timestamptz not null default now()
);

-- Signatures (click-wrap evidence)
create table signatures (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references agreements(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  signed_at timestamptz not null default now(),
  ip_address text not null,
  user_agent text not null,
  unique(agreement_id, member_id)
);

-- Payments (Stripe records)
create table payments (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references syndicates(id) on delete cascade,
  member_id uuid references members(id),
  stripe_session_id text not null unique,
  amount integer not null, -- cents
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_members_syndicate on members(syndicate_id);
create index idx_members_user on members(user_id);
create index idx_members_email on members(email);
create index idx_invitations_token on invitations(token);
create index idx_invitations_syndicate on invitations(syndicate_id);
create index idx_agreements_syndicate on agreements(syndicate_id);
create index idx_signatures_agreement on signatures(agreement_id);
create index idx_payments_syndicate on payments(syndicate_id);
create index idx_payments_stripe on payments(stripe_session_id);

-- RLS Policies
alter table syndicates enable row level security;
alter table members enable row level security;
alter table invitations enable row level security;
alter table agreements enable row level security;
alter table signatures enable row level security;
alter table payments enable row level security;

-- Syndicates: members can read their own syndicates, creator can create
create policy "Members can view their syndicates"
  on syndicates for select
  using (
    id in (select syndicate_id from members where user_id = auth.uid())
  );

create policy "Authenticated users can create syndicates"
  on syndicates for insert
  with check (auth.uid() = created_by);

create policy "Creator can update draft syndicates"
  on syndicates for update
  using (created_by = auth.uid() and status = 'draft');

-- Members: syndicate members can read, creator can insert
create policy "Members can view syndicate members"
  on members for select
  using (
    syndicate_id in (select syndicate_id from members where user_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Syndicate creator can add members"
  on members for insert
  with check (
    syndicate_id in (select id from syndicates where created_by = auth.uid())
  );

create policy "Members can update their own record"
  on members for update
  using (user_id = auth.uid());

-- Invitations: token-based access (public read by token for join page)
create policy "Anyone can read invitation by token"
  on invitations for select
  using (true); -- Token secrecy is the access control

create policy "Syndicate creator can create invitations"
  on invitations for insert
  with check (
    syndicate_id in (select id from syndicates where created_by = auth.uid())
  );

create policy "Invitation recipient can update status"
  on invitations for update
  using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Agreements: syndicate members can read
create policy "Members can view agreements"
  on agreements for select
  using (
    syndicate_id in (select syndicate_id from members where user_id = auth.uid())
  );

create policy "Syndicate creator can create agreements"
  on agreements for insert
  with check (
    syndicate_id in (select id from syndicates where created_by = auth.uid())
  );

create policy "Service role updates agreements"
  on agreements for update
  using (true); -- Updated by service role (PDF generation, status changes)

-- Signatures: members can read and create their own
create policy "Members can view signatures"
  on signatures for select
  using (
    agreement_id in (
      select a.id from agreements a
      join members m on m.syndicate_id = a.syndicate_id
      where m.user_id = auth.uid()
    )
  );

create policy "Members can sign"
  on signatures for insert
  with check (
    member_id in (select id from members where user_id = auth.uid())
  );

-- Payments: creator can read their payments
create policy "Members can view payments"
  on payments for select
  using (
    syndicate_id in (select syndicate_id from members where user_id = auth.uid())
  );

create policy "Authenticated users can create payments"
  on payments for insert
  with check (auth.uid() is not null);

-- Storage bucket for PDFs
insert into storage.buckets (id, name, public)
values ('agreements', 'agreements', false)
on conflict do nothing;

-- Storage RLS: only syndicate members can download
create policy "Members can read agreement PDFs"
  on storage.objects for select
  using (
    bucket_id = 'agreements'
    and (storage.foldername(name))[1] in (
      select syndicate_id::text from members where user_id = auth.uid()
    )
  );

create policy "Service role can upload PDFs"
  on storage.objects for insert
  with check (bucket_id = 'agreements');
