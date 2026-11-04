/**
 * Supabase 클라이언트.
 * .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 실제 서버를 쓰고,
 * 없으면 null — 앱은 src/data/world.ts 예시 데이터로 동작한다.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isLive = Boolean(supabase);

/** 엣지 함수 호출 — 서버가 없으면 null을 돌려주고 화면은 예시 동작으로 대체 */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    console.warn(`[${name}]`, error.message);
    return null;
  }
  return data;
}

/* ---------- 휴대폰 인증 ---------- */

/** 010-1234-5678 → +821012345678 */
export const toE164 = (phone: string) => '+82' + phone.replace(/\D/g, '').replace(/^0/, '');

export async function requestOtp(phone: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: true, message: '예시 모드: 인증번호 123456' };
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function verifyOtp(phone: string, token: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return token === '123456' ? { ok: true } : { ok: false, message: '인증번호가 맞지 않아요' };
  const { error } = await supabase.auth.verifyOtp({ phone: toE164(phone), token, type: 'sms' });
  return error ? { ok: false, message: '인증번호가 맞지 않아요' } : { ok: true };
}
