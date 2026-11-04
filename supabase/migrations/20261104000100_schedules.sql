-- =========================================================
-- 주기 작업 — pg_cron + pg_net 으로 엣지 함수 호출
--   · refresh-top5     : 매시 정각 (실시간 꿀팁 검색 Top5, 1시간 단위 갱신)
--   · recompute-peers  : 매일 04:10 KST (유사취향자 상위 20% · 계정 신뢰도 재계산)
--   · purge-deleted    : 매일 04:30 KST (삭제 후 15일 지난 게시물 영구 삭제, 만료 데이터 다운로드 정리)
--
-- 먼저 Vault에 프로젝트 URL과 service_role 키를 넣어 둔다 (Dashboard > Project Settings > Vault):
--   select vault.create_secret('https://<project>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
-- =========================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_function(fn text) returns void language plpgsql security definer as $$
declare
  base text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  key  text := (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key');
begin
  perform net.http_post(
    url     := base || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || key),
    body    := '{}'::jsonb
  );
end $$;

-- UTC 기준 (KST = UTC+9)
select cron.schedule('twinsy-refresh-top5',    '0 * * * *',  $$ select public.invoke_function('refresh-top5') $$);
select cron.schedule('twinsy-recompute-peers', '10 19 * * *', $$ select public.invoke_function('recompute-peers') $$);
select cron.schedule('twinsy-purge-deleted',   '30 19 * * *', $$
  delete from public.posts where deleted_at < now() - interval '15 days';
  update public.data_exports set status = 'expired' where status = 'ready' and expires_at < now();
$$);
