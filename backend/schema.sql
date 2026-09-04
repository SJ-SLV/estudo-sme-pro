-- Esquema da base de dados do Estudo SME Pro
-- Corre este ficheiro uma vez na tua base Postgres (ex: SQL editor do Supabase)

create extension if not exists pgcrypto;

create table if not exists administradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  codigo_hash text not null,
  criado_em timestamptz not null default now()
);

create table if not exists candidatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  referencia text not null unique,
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  codigo_hash text,
  visto boolean not null default false,
  criado_em timestamptz not null default now(),
  aprovado_em timestamptz
);

create index if not exists idx_candidatos_referencia on candidatos (referencia);
create index if not exists idx_candidatos_status on candidatos (status);

-- Linha única com o aviso mostrado na barra rolante dos candidatos
create table if not exists avisos (
  id int primary key default 1,
  texto text not null default '',
  publicado_em timestamptz not null default now(),
  constraint avisos_linha_unica check (id = 1)
);
insert into avisos (id, texto) values (1, '') on conflict (id) do nothing;

-- Ativa o RLS em todas as tabelas. Sem políticas definidas, isto bloqueia
-- qualquer acesso pela API REST automática do Supabase (anon key), que não é
-- usada nesta arquitetura. O backend continua a funcionar normalmente porque
-- liga-se com o utilizador "postgres", que tem BYPASSRLS por omissão.
alter table administradores enable row level security;
alter table candidatos enable row level security;
alter table avisos enable row level security;
