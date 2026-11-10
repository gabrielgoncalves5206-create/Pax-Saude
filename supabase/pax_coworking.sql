-- Interesse de profissionais em alugar consultório no MITI (coworking).
create table if not exists public.pax_coworking(
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 3 and 120),
  registro text not null check (char_length(registro) between 3 and 30),
  especialidade text not null check (char_length(especialidade) between 2 and 80),
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),
  periodo text,
  criado_em timestamptz not null default now()
);
alter table public.pax_coworking enable row level security;
revoke all on public.pax_coworking from anon, authenticated;

create or replace function public.pax_coworking_enviar(p_nome text,p_registro text,p_especialidade text,p_telefone text,p_periodo text default null)
returns json language plpgsql security definer set search_path=public as $$
declare t text:=regexp_replace(coalesce(p_telefone,''),'\D','','g');
begin
  if char_length(trim(coalesce(p_nome,'')))<3 then return json_build_object('ok',false,'erro','nome_invalido'); end if;
  if char_length(trim(coalesce(p_registro,'')))<3 then return json_build_object('ok',false,'erro','registro_invalido'); end if;
  if char_length(trim(coalesce(p_especialidade,'')))<2 then return json_build_object('ok',false,'erro','especialidade_invalida'); end if;
  if t !~ '^[0-9]{10,11}$' then return json_build_object('ok',false,'erro','telefone_invalido'); end if;
  if exists(select 1 from pax_coworking where telefone=t and criado_em>now()-interval '1 day') then
    return json_build_object('ok',true,'repetido',true); end if;
  insert into pax_coworking(nome,registro,especialidade,telefone,periodo)
  values(trim(p_nome),upper(trim(p_registro)),trim(p_especialidade),t,left(p_periodo,40));
  return json_build_object('ok',true);
end $$;
revoke all on function public.pax_coworking_enviar(text,text,text,text,text) from public;
grant execute on function public.pax_coworking_enviar(text,text,text,text,text) to anon, authenticated;
