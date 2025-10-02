-- Create system_settings table for global app configuration
create table if not exists public.system_settings (
  id text primary key,
  church_name text not null default '',
  contact_email text,
  contact_phone text,
  timezone text not null default 'Africa/Accra',
  date_format text not null default 'DD/MM/YYYY',
  currency text not null default 'GHS',
  max_cell_size integer not null default 20,
  backup_frequency text not null default 'daily' check (backup_frequency in ('daily','weekly','monthly')),
  email_notifications boolean not null default true,
  sms_notifications boolean not null default false,
  push_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute procedure public.set_updated_at();

-- Seed singleton row if not exists
insert into public.system_settings (id, church_name, contact_email, contact_phone)
values ('global', 'Victory Bible Church Intl', 'admin@victorybible.org', '+233 123 456 7890')
on conflict (id) do nothing;
