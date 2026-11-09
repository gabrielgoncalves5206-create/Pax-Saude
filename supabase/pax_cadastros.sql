-- Pax - Saúde: cadastro único por celular.
-- Rodar uma vez no SQL Editor do Supabase (projeto do Pax). Não altera nenhuma tabela existente.
-- A tabela fica fechada (RLS sem políticas); o app só chama a função pax_cadastrar.

create table if not exists public.pax_cadastros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 120),
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),
  convenio text not null default 'Particular' check (char_length(convenio) between 2 and 60),
  criado timestamptz not null default now(),
  constraint pax_cadastros_telefone_key unique (telefone)
);
alter table public.pax_cadastros enable row level security;
revoke all on public.pax_cadastros from anon, authenticated;

create or replace function public.pax_cadastrar(p_nome text, p_telefone text, p_convenio text default 'Particular')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d text := regexp_replace(coalesce(p_telefone,''), '\D', '', 'g');
  n text := btrim(coalesce(p_nome,''));
  c text := btrim(coalesce(nullif(p_convenio,''),'Particular'));
begin
  if length(d) in (12,13) and left(d,2) = '55' then d := substr(d,3); end if;
  if length(d) not in (10,11) then return jsonb_build_object('ok',false,'erro','telefone_invalido'); end if;
  if char_length(n) < 2 or char_length(n) > 120 then return jsonb_build_object('ok',false,'erro','nome_invalido'); end if;
  if char_length(c) < 2 or char_length(c) > 60 then c := 'Particular'; end if;
  insert into public.pax_cadastros(nome, telefone, convenio) values (n, d, c);
  return jsonb_build_object('ok',true,'telefone',d);
exception when unique_violation then
  return jsonb_build_object('ok',false,'erro','telefone_existente');
end;
$$;
revoke all on function public.pax_cadastrar(text,text,text) from public;
grant execute on function public.pax_cadastrar(text,text,text) to anon, authenticated;
