-- VittaOne: foto do pedido médico fica disponível por 5 dias (antes: 14).
-- Rodar uma vez no SQL Editor do Supabase.
create or replace function public.pax_pedido_ver(p_id uuid) returns json language sql security definer set search_path=public as $$
  select coalesce((select json_build_object('ok',true,'img',img,'expira',criado_em+interval '5 days') from pax_pedidos where id=p_id and criado_em>now()-interval '5 days'),json_build_object('ok',false));
$$;
revoke all on function public.pax_pedido_ver(uuid) from public; grant execute on function public.pax_pedido_ver(uuid) to anon, authenticated;
select cron.unschedule('pax_pedidos_limpeza');
select cron.schedule('pax_pedidos_limpeza','17 6 * * *',$$delete from public.pax_pedidos where criado_em < now()-interval '5 days'; delete from public.pax_lembretes where quando < now()-interval '3 days'$$);
