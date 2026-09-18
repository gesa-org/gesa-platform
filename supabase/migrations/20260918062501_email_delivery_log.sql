-- Transactional-email audit trail. The application writes this table only
-- through the server-side service-role client; admins receive read-only RLS
-- access for the CRM history page. It deliberately keeps related records
-- polymorphic because bookings, invitations, and future operational events
-- have different primary tables.
create table public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  template_type text not null,
  recipient_role text not null check (recipient_role in ('client', 'therapist', 'admin', 'system')),
  recipient_email text not null,
  related_record_type text not null,
  related_record_id text not null,
  provider_message_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained', 'suppressed', 'retrying')),
  failure_reason text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index email_delivery_log_status_created_at_idx
  on public.email_delivery_log (status, created_at desc);
create index email_delivery_log_related_record_idx
  on public.email_delivery_log (related_record_type, related_record_id, created_at desc);
create index email_delivery_log_recipient_email_idx
  on public.email_delivery_log (recipient_email, created_at desc);

alter table public.email_delivery_log enable row level security;

create policy "email_delivery_log_admin_read"
  on public.email_delivery_log
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('admin', 'super_admin')
    )
  );

comment on table public.email_delivery_log is
  'Server-written transactional email audit trail. Admins may read history; clients and therapists have no access.';
