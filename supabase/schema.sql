-- Nexora ERP - Schema principal (multiempresa)
-- Execute este SQL no Supabase SQL Editor

-- RESET COMPLETO (destrutivo): remove estrutura atual antes de recriar
drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.bootstrap_empresa_for_user() cascade;
drop function if exists public.accept_pending_invites_for_current_user() cascade;
drop function if exists public.confirmar_pedido(uuid) cascade;
drop function if exists public.has_active_subscription() cascade;
drop function if exists public.admin_empresas_overview() cascade;
drop function if exists public.is_platform_admin(uuid) cascade;
drop function if exists public.listar_minhas_empresas() cascade;
drop function if exists public.definir_empresa_ativa(uuid) cascade;
drop function if exists public.criar_empresa(text) cascade;
drop function if exists public.excluir_empresa(uuid) cascade;
drop function if exists public.current_empresa_id() cascade;
drop function if exists public.is_empresa_member(uuid) cascade;
drop function if exists public.set_updated_at() cascade;

drop table if exists public.assinaturas cascade;
drop table if exists public.checkout_intents cascade;
drop table if exists public.platform_admins cascade;
drop table if exists public.usuario_preferencias cascade;
drop table if exists public.planos cascade;
drop table if exists public.pedido_itens cascade;
drop table if exists public.pagamentos cascade;
drop table if exists public.contas_receber cascade;
drop table if exists public.pedidos cascade;
drop table if exists public.produtos cascade;
drop table if exists public.clientes cascade;
drop table if exists public.configuracoes cascade;
drop table if exists public.convites_empresa cascade;
drop table if exists public.empresa_membros cascade;
drop table if exists public.empresas cascade;

create extension if not exists "pgcrypto";

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresa_membros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'owner' check (papel in ('owner', 'admin', 'financeiro', 'vendedor')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, user_id)
);

create table if not exists public.usuario_preferencias (
  user_id uuid primary key references auth.users(id) on delete cascade,
  empresa_ativa_id uuid references public.empresas(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.convites_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  email text not null,
  papel text not null default 'vendedor' check (papel in ('owner', 'admin', 'financeiro', 'vendedor')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  convidado_por uuid references auth.users(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'expirado', 'cancelado')),
  expira_em timestamptz not null default (now() + interval '7 day'),
  created_at timestamptz not null default now(),
  unique (empresa_id, email, status)
);

create or replace function public.is_empresa_member(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = p_empresa_id
      and em.user_id = auth.uid()
      and em.status = 'ativo'
  );
$$;

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select up.empresa_ativa_id
      from public.usuario_preferencias up
      where up.user_id = auth.uid()
        and up.empresa_ativa_id is not null
        and exists (
          select 1
          from public.empresa_membros em2
          where em2.empresa_id = up.empresa_ativa_id
            and em2.user_id = auth.uid()
            and em2.status = 'ativo'
        )
      limit 1
    ),
    (
      select em.empresa_id
      from public.empresa_membros em
      where em.user_id = auth.uid()
        and em.status = 'ativo'
      order by
        case em.papel
          when 'owner' then 0
          when 'admin' then 1
          when 'financeiro' then 2
          else 3
        end,
        em.created_at asc
      limit 1
    )
  );
$$;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  razao_social text not null,
  cnpj text,
  inscricao_estadual text,
  endereco text,
  cidade text,
  bairro text,
  uf text,
  cep text,
  telefone text,
  email text,
  contato text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, id)
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  codigo text not null,
  descricao text not null,
  unidade text not null,
  preco numeric(12,2) not null default 0,
  imagem_url text,
  ativo boolean not null default true,
  estoque_atual numeric(12,3) not null default 0,
  estoque_minimo numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, codigo),
  unique (empresa_id, id)
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  cliente_id uuid not null,
  status text not null default 'rascunho',
  data_pedido date not null default current_date,
  observacoes text,
  desconto_total numeric(12,2) not null default 0,
  total_bruto numeric(12,2) not null default 0,
  total_liquido numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, id),
  constraint pedidos_cliente_fk
    foreign key (empresa_id, cliente_id)
    references public.clientes (empresa_id, id)
    on delete restrict
);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  pedido_id uuid not null,
  produto_id uuid not null,
  quantidade numeric(12,3) not null,
  valor_unitario numeric(12,2) not null,
  desconto numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  constraint pedido_itens_pedido_fk
    foreign key (empresa_id, pedido_id)
    references public.pedidos (empresa_id, id)
    on delete cascade,
  constraint pedido_itens_produto_fk
    foreign key (empresa_id, produto_id)
    references public.produtos (empresa_id, id)
    on delete restrict
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  pedido_id uuid not null,
  forma text not null,
  valor_pago numeric(12,2) not null,
  status text not null default 'pendente',
  data_pagamento date,
  constraint pagamentos_pedido_fk
    foreign key (empresa_id, pedido_id)
    references public.pedidos (empresa_id, id)
    on delete cascade
);

create table if not exists public.contas_receber (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.current_empresa_id() references public.empresas(id) on delete cascade,
  pedido_id uuid not null,
  valor_total numeric(12,2) not null,
  valor_pago numeric(12,2) not null default 0,
  saldo numeric(12,2) not null,
  status text not null default 'aberto',
  created_at timestamptz not null default now(),
  unique (empresa_id, pedido_id),
  constraint contas_receber_pedido_fk
    foreign key (empresa_id, pedido_id)
    references public.pedidos (empresa_id, id)
    on delete cascade
);

create table if not exists public.configuracoes (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  bloquear_sem_estoque boolean not null default true
);

create table if not exists public.planos (
  id text primary key,
  nome text not null,
  preco_mensal_centavos integer not null,
  stripe_price_id text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  plano_id text not null references public.planos(id),
  provider text not null default 'stripe',
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  plano_id text not null references public.planos(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'canceled', 'claimed')),
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  paid_at timestamptz,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.planos (id, nome, preco_mensal_centavos, stripe_price_id, ativo)
values
  ('starter', 'Starter', 7900, null, true),
  ('pro', 'Pro', 14900, null, true)
on conflict (id) do update
set nome = excluded.nome,
    preco_mensal_centavos = excluded.preco_mensal_centavos,
    ativo = excluded.ativo;

create or replace function public.bootstrap_empresa_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_convite record;
  v_tem_convite boolean := false;
  v_checkout record;
  v_primeira_empresa uuid;
begin
  select id, empresa_id
  into v_checkout
  from public.checkout_intents
  where lower(email) = lower(new.email)
    and status = 'paid'
    and claimed_at is null
  order by created_at desc
  limit 1;

  if v_checkout.id is not null then
    insert into public.empresa_membros (empresa_id, user_id, papel, status)
    values (v_checkout.empresa_id, new.id, 'owner', 'ativo')
    on conflict (empresa_id, user_id) do update
    set papel = excluded.papel, status = 'ativo', updated_at = now();

    insert into public.configuracoes (empresa_id, bloquear_sem_estoque)
    values (v_checkout.empresa_id, true)
    on conflict (empresa_id) do nothing;

    update public.checkout_intents
    set status = 'claimed',
        claimed_by_user_id = new.id,
        claimed_at = now(),
        updated_at = now()
    where id = v_checkout.id;

    insert into public.usuario_preferencias (user_id, empresa_ativa_id, updated_at)
    values (new.id, v_checkout.empresa_id, now())
    on conflict (user_id) do update
    set empresa_ativa_id = excluded.empresa_ativa_id,
        updated_at = now();

    return new;
  end if;

  for v_convite in
    select id, empresa_id, papel
    from public.convites_empresa
    where lower(email) = lower(new.email)
      and status = 'pendente'
      and expira_em > now()
    order by created_at asc
  loop
    v_tem_convite := true;
    if v_primeira_empresa is null then
      v_primeira_empresa := v_convite.empresa_id;
    end if;

    insert into public.empresa_membros (empresa_id, user_id, papel, status)
    values (v_convite.empresa_id, new.id, v_convite.papel, 'ativo')
    on conflict (empresa_id, user_id) do update
    set papel = excluded.papel, status = 'ativo', updated_at = now();

    update public.convites_empresa
    set status = 'aceito'
    where id = v_convite.id;
  end loop;

  if v_tem_convite and v_primeira_empresa is not null then
    insert into public.usuario_preferencias (user_id, empresa_ativa_id, updated_at)
    values (new.id, v_primeira_empresa, now())
    on conflict (user_id) do update
    set empresa_ativa_id = excluded.empresa_ativa_id,
        updated_at = now();
  end if;

  if not v_tem_convite then
    insert into public.empresas (nome)
    values (coalesce(split_part(new.email, '@', 1), 'Empresa'))
    returning id into v_empresa_id;

    insert into public.empresa_membros (empresa_id, user_id, papel, status)
    values (v_empresa_id, new.id, 'owner', 'ativo');

    insert into public.configuracoes (empresa_id, bloquear_sem_estoque)
    values (v_empresa_id, true);

    insert into public.assinaturas (
      empresa_id,
      plano_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end
    )
    values (
      v_empresa_id,
      'starter',
      'trialing',
      now() + interval '14 day',
      now(),
      now() + interval '14 day'
    );

    insert into public.usuario_preferencias (user_id, empresa_ativa_id, updated_at)
    values (new.id, v_empresa_id, now())
    on conflict (user_id) do update
    set empresa_ativa_id = excluded.empresa_ativa_id,
        updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.bootstrap_empresa_for_user();

create or replace function public.accept_pending_invites_for_current_user()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_convite record;
  v_total integer := 0;
  v_primeira_empresa uuid;
begin
  if v_user_id is null then
    return 0;
  end if;

  select email into v_user_email
  from auth.users
  where id = v_user_id;

  if v_user_email is null then
    return 0;
  end if;

  for v_convite in
    select id, empresa_id, papel
    from public.convites_empresa
    where lower(email) = lower(v_user_email)
      and status = 'pendente'
      and expira_em > now()
  loop
    if v_primeira_empresa is null then
      v_primeira_empresa := v_convite.empresa_id;
    end if;

    insert into public.empresa_membros (empresa_id, user_id, papel, status)
    values (v_convite.empresa_id, v_user_id, v_convite.papel, 'ativo')
    on conflict (empresa_id, user_id) do update
    set papel = excluded.papel, status = 'ativo', updated_at = now();

    update public.convites_empresa
    set status = 'aceito'
    where id = v_convite.id;

    v_total := v_total + 1;
  end loop;

  if v_primeira_empresa is not null then
    perform public.definir_empresa_ativa(v_primeira_empresa);
  end if;

  return v_total;
end;
$$;

create or replace function public.listar_minhas_empresas()
returns table (
  empresa_id uuid,
  nome text,
  papel text,
  status text,
  ativa boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as empresa_id,
    e.nome,
    em.papel,
    em.status,
    (e.id = public.current_empresa_id()) as ativa
  from public.empresa_membros em
  join public.empresas e on e.id = em.empresa_id
  where em.user_id = auth.uid()
  order by e.nome asc;
$$;

create or replace function public.definir_empresa_ativa(p_empresa_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if not exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = p_empresa_id
      and em.user_id = auth.uid()
      and em.status = 'ativo'
  ) then
    raise exception 'Usuario sem acesso a empresa informada';
  end if;

  insert into public.usuario_preferencias (user_id, empresa_ativa_id, updated_at)
  values (auth.uid(), p_empresa_id, now())
  on conflict (user_id) do update
  set empresa_ativa_id = excluded.empresa_ativa_id,
      updated_at = now();

  return true;
end;
$$;

create or replace function public.criar_empresa(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if coalesce(trim(p_nome), '') = '' then
    raise exception 'Nome da empresa e obrigatorio';
  end if;

  insert into public.empresas (nome)
  values (trim(p_nome))
  returning id into v_empresa_id;

  insert into public.empresa_membros (empresa_id, user_id, papel, status)
  values (v_empresa_id, auth.uid(), 'owner', 'ativo');

  insert into public.configuracoes (empresa_id, bloquear_sem_estoque)
  values (v_empresa_id, true);

  insert into public.assinaturas (
    empresa_id,
    plano_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  values (
    v_empresa_id,
    'starter',
    'trialing',
    now() + interval '14 day',
    now(),
    now() + interval '14 day'
  )
  on conflict (empresa_id) do nothing;

  perform public.definir_empresa_ativa(v_empresa_id);
  return v_empresa_id;
end;
$$;

create or replace function public.excluir_empresa(p_empresa_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if not exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = p_empresa_id
      and em.user_id = auth.uid()
      and em.papel = 'owner'
      and em.status = 'ativo'
  ) then
    raise exception 'Apenas owner pode excluir a empresa';
  end if;

  delete from public.empresas
  where id = p_empresa_id;

  update public.usuario_preferencias up
  set empresa_ativa_id = null, updated_at = now()
  where up.user_id = auth.uid()
    and up.empresa_ativa_id = p_empresa_id;

  return true;
end;
$$;

create or replace function public.is_platform_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = p_user_id
       or (
         pa.email is not null
         and lower(pa.email) = lower((select u.email from auth.users u where u.id = p_user_id))
       )
  );
$$;

create or replace function public.admin_empresas_overview()
returns table (
  empresa_id uuid,
  nome text,
  created_at timestamptz,
  assinatura_status text,
  plano_id text,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  total_membros bigint,
  membros_ativos bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  return query
  select
    e.id,
    e.nome,
    e.created_at,
    a.status as assinatura_status,
    a.plano_id,
    a.current_period_end,
    a.trial_ends_at,
    coalesce(m.total_membros, 0) as total_membros,
    coalesce(m.membros_ativos, 0) as membros_ativos
  from public.empresas e
  left join public.assinaturas a on a.empresa_id = e.id
  left join (
    select
      em.empresa_id,
      count(*)::bigint as total_membros,
      count(*) filter (where em.status = 'ativo')::bigint as membros_ativos
    from public.empresa_membros em
    group by em.empresa_id
  ) m on m.empresa_id = e.id
  order by e.created_at desc;
end;
$$;

create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assinaturas a
    where a.empresa_id = public.current_empresa_id()
      and a.status in ('trialing', 'active')
      and (
        a.status = 'active'
        or a.trial_ends_at is null
        or a.trial_ends_at >= now()
      )
      and (a.current_period_end is null or a.current_period_end >= now())
  );
$$;

create or replace function public.confirmar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_bloquear boolean;
  v_item record;
  v_total numeric(12,2);
begin
  select empresa_id into v_empresa_id from public.pedidos where id = p_pedido_id;
  if v_empresa_id is null or not public.is_empresa_member(v_empresa_id) then
    raise exception 'Pedido invalido';
  end if;

  select bloquear_sem_estoque
  into v_bloquear
  from public.configuracoes
  where empresa_id = v_empresa_id;

  if v_bloquear is null then
    v_bloquear := true;
  end if;

  for v_item in
    select produto_id, quantidade
    from public.pedido_itens
    where pedido_id = p_pedido_id and empresa_id = v_empresa_id
  loop
    if v_bloquear then
      if (
        select estoque_atual
        from public.produtos
        where id = v_item.produto_id and empresa_id = v_empresa_id
      ) < v_item.quantidade then
        raise exception 'Estoque insuficiente para confirmar pedido';
      end if;
    end if;
  end loop;

  update public.produtos p
  set estoque_atual = p.estoque_atual - i.quantidade
  from public.pedido_itens i
  where i.pedido_id = p_pedido_id
    and i.empresa_id = v_empresa_id
    and p.id = i.produto_id
    and p.empresa_id = v_empresa_id;

  update public.pedidos
  set status = 'confirmado', updated_at = now()
  where id = p_pedido_id and empresa_id = v_empresa_id;

  select total_liquido into v_total
  from public.pedidos
  where id = p_pedido_id and empresa_id = v_empresa_id;

  insert into public.contas_receber (empresa_id, pedido_id, valor_total, valor_pago, saldo, status)
  values (v_empresa_id, p_pedido_id, v_total, 0, v_total, 'aberto')
  on conflict (empresa_id, pedido_id) do nothing;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_updated_at on public.empresas;
create trigger empresas_updated_at before update on public.empresas
for each row execute procedure public.set_updated_at();

drop trigger if exists empresa_membros_updated_at on public.empresa_membros;
create trigger empresa_membros_updated_at before update on public.empresa_membros
for each row execute procedure public.set_updated_at();

drop trigger if exists usuario_preferencias_updated_at on public.usuario_preferencias;
create trigger usuario_preferencias_updated_at before update on public.usuario_preferencias
for each row execute procedure public.set_updated_at();

drop trigger if exists assinaturas_updated_at on public.assinaturas;
create trigger assinaturas_updated_at before update on public.assinaturas
for each row execute procedure public.set_updated_at();

drop trigger if exists checkout_intents_updated_at on public.checkout_intents;
create trigger checkout_intents_updated_at before update on public.checkout_intents
for each row execute procedure public.set_updated_at();

drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at before update on public.clientes
for each row execute procedure public.set_updated_at();

drop trigger if exists produtos_updated_at on public.produtos;
create trigger produtos_updated_at before update on public.produtos
for each row execute procedure public.set_updated_at();

drop trigger if exists pedidos_updated_at on public.pedidos;
create trigger pedidos_updated_at before update on public.pedidos
for each row execute procedure public.set_updated_at();

alter table public.empresas enable row level security;
alter table public.empresa_membros enable row level security;
alter table public.usuario_preferencias enable row level security;
alter table public.platform_admins enable row level security;
alter table public.convites_empresa enable row level security;
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;
alter table public.checkout_intents enable row level security;
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.pagamentos enable row level security;
alter table public.contas_receber enable row level security;
alter table public.configuracoes enable row level security;

drop policy if exists "Empresas por membro" on public.empresas;
create policy "Empresas por membro" on public.empresas
for all
using (id = public.current_empresa_id())
with check (id = public.current_empresa_id());

drop policy if exists "Membros por empresa" on public.empresa_membros;
drop policy if exists "Membros leitura por empresa" on public.empresa_membros;
drop policy if exists "Membros gestao por manager" on public.empresa_membros;
drop policy if exists "Membros atualizacao por manager" on public.empresa_membros;
drop policy if exists "Membros exclusao por manager" on public.empresa_membros;
create policy "Membros leitura por empresa" on public.empresa_membros
for select
using (empresa_id = public.current_empresa_id());
create policy "Membros gestao por manager" on public.empresa_membros
for insert
with check (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
);
create policy "Membros atualizacao por manager" on public.empresa_membros
for update
using (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
)
with check (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
);
create policy "Membros exclusao por manager" on public.empresa_membros
for delete
using (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
);

drop policy if exists "Preferencias por usuario" on public.usuario_preferencias;
create policy "Preferencias por usuario" on public.usuario_preferencias
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Platform admin self read" on public.platform_admins;
create policy "Platform admin self read" on public.platform_admins
for select
using (
  user_id = auth.uid()
  or (
    email is not null
    and lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  )
);

drop policy if exists "Convites por empresa" on public.convites_empresa;
drop policy if exists "Convites leitura por empresa" on public.convites_empresa;
drop policy if exists "Convites gestao por manager" on public.convites_empresa;
create policy "Convites leitura por empresa" on public.convites_empresa
for select
using (empresa_id = public.current_empresa_id());
create policy "Convites gestao por manager" on public.convites_empresa
for all
using (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
)
with check (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
);

drop policy if exists "Planos publicos ativos" on public.planos;
create policy "Planos publicos ativos" on public.planos
for select
using (ativo = true);

drop policy if exists "Assinatura por empresa" on public.assinaturas;
drop policy if exists "Assinatura leitura por empresa" on public.assinaturas;
create policy "Assinatura por empresa" on public.assinaturas
for select
using (empresa_id = public.current_empresa_id());

drop policy if exists "Clientes por empresa" on public.clientes;
create policy "Clientes por empresa" on public.clientes
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Produtos por empresa" on public.produtos;
create policy "Produtos por empresa" on public.produtos
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Pedidos por empresa" on public.pedidos;
create policy "Pedidos por empresa" on public.pedidos
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Itens por empresa" on public.pedido_itens;
create policy "Itens por empresa" on public.pedido_itens
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Pagamentos por empresa" on public.pagamentos;
create policy "Pagamentos por empresa" on public.pagamentos
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Contas por empresa" on public.contas_receber;
create policy "Contas por empresa" on public.contas_receber
for all
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "Configuracoes por empresa" on public.configuracoes;
drop policy if exists "Configuracoes leitura por empresa" on public.configuracoes;
drop policy if exists "Configuracoes gestao por manager" on public.configuracoes;
create policy "Configuracoes por empresa" on public.configuracoes
for select
using (empresa_id = public.current_empresa_id());
create policy "Configuracoes gestao por manager" on public.configuracoes
for all
using (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
)
with check (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1
    from public.empresa_membros em
    where em.empresa_id = public.current_empresa_id()
      and em.user_id = auth.uid()
      and em.status = 'ativo'
      and em.papel in ('owner', 'admin')
  )
);