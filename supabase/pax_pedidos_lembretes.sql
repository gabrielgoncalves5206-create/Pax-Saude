
create table if not exists public.pax_pedidos(id uuid primary key default gen_random_uuid(),img text not null check (char_length(img) < 900000),criado_em timestamptz not null default now());
alter table public.pax_pedidos enable row level security;
revoke all on public.pax_pedidos from anon, authenticated;
create or replace function public.pax_pedido_enviar(p_img text) returns json language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  if p_img is null or p_img !~ '^data:image/(jpeg|webp|png);base64,' or char_length(p_img)>=900000 then return json_build_object('ok',false,'erro','imagem_invalida'); end if;
  insert into pax_pedidos(img) values(p_img) returning id into v;
  return json_build_object('ok',true,'id',v);
end $$;
create or replace function public.pax_pedido_ver(p_id uuid) returns json language sql security definer set search_path=public as $$
  select coalesce((select json_build_object('ok',true,'img',img,'expira',criado_em+interval '14 days') from pax_pedidos where id=p_id and criado_em>now()-interval '14 days'),json_build_object('ok',false));
$$;
revoke all on function public.pax_pedido_enviar(text) from public; grant execute on function public.pax_pedido_enviar(text) to anon, authenticated;
revoke all on function public.pax_pedido_ver(uuid) from public; grant execute on function public.pax_pedido_ver(uuid) to anon, authenticated;

create table if not exists public.pax_lembretes(id uuid primary key default gen_random_uuid(),endpoint text not null,p256dh text not null,auth text not null,quando timestamptz not null,titulo text not null,corpo text not null,enviado boolean not null default false,criado_em timestamptz not null default now());
alter table public.pax_lembretes enable row level security;
revoke all on public.pax_lembretes from anon, authenticated;
create index if not exists pax_lembretes_pend on public.pax_lembretes(quando) where not enviado;
create or replace function public.pax_lembrete_agendar(p_endpoint text,p_p256dh text,p_auth text,p_quando timestamptz,p_titulo text,p_corpo text) returns json language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  if p_endpoint !~ '^https://' or char_length(p_endpoint)>800 or p_quando<now() or p_quando>now()+interval '120 days' then return json_build_object('ok',false); end if;
  insert into pax_lembretes(endpoint,p256dh,auth,quando,titulo,corpo) values(p_endpoint,left(p_p256dh,200),left(p_auth,100),p_quando,left(p_titulo,80),left(p_corpo,200)) returning id into v;
  return json_build_object('ok',true,'id',v);
end $$;
create or replace function public.pax_lembrete_cancelar(p_id uuid) returns void language sql security definer set search_path=public as $$ delete from pax_lembretes where id=p_id; $$;
revoke all on function public.pax_lembrete_agendar(text,text,text,timestamptz,text,text) from public; grant execute on function public.pax_lembrete_agendar(text,text,text,timestamptz,text,text) to anon, authenticated;
revoke all on function public.pax_lembrete_cancelar(uuid) from public; grant execute on function public.pax_lembrete_cancelar(uuid) to anon, authenticated;

create table if not exists public.pax_config(k text primary key,v text not null);
alter table public.pax_config enable row level security;
revoke all on public.pax_config from anon, authenticated;
insert into public.pax_config values('vapid_public','BMJfFkD1_9mFOq5MywP8rKyyeLJwCZfmCGoIH65AYrfzI6nbBXXH_p4oH0NLzpm7MORQjdKnsYmAt9LGAAEskpM'),('vapid_private','<definido no banco>'),('cron_token','<definido no banco>') on conflict (k) do update set v=excluded.v;

select cron.schedule('pax_pedidos_limpeza','17 6 * * *',$$delete from public.pax_pedidos where criado_em < now()-interval '14 days'; delete from public.pax_lembretes where quando < now()-interval '3 days'$$);
select cron.schedule('pax_lembretes_envio','5 * * * *',$$select net.http_post(url:='https://cckywhtpnjhlwqslmlxz.supabase.co/functions/v1/pax-lembretes',headers:=jsonb_build_object('Content-Type','application/json','x-pax-cron',(select v from public.pax_config where k='cron_token')),body:='{}'::jsonb)$$);
