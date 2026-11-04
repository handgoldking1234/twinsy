import { useState } from 'react';
import { BottomSheet, Button, SubHeader } from '../components/ui';
import { isLive, requestOtp, verifyOtp } from '../lib/supabase';
import type { Nav } from '../App';

/** 로그인 · 회원가입 — 휴대폰 인증 → 취향 테스트(신규) */
export function LoginScreen({ nav }: { nav: Nav }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const phoneOk = /^01\d-?\d{3,4}-?\d{4}$/.test(phone);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  return (
    <div className="screen">
      <SubHeader title="" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <form
          className="auth"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            if (!sent) {
              const r = await requestOtp(phone);
              setBusy(false);
              if (!r.ok) return setError(r.message ?? '인증번호를 보내지 못했어요. 번호를 확인해 주세요');
              setSent(true);
              setInfo(r.message ?? '인증번호를 보냈어요');
            } else {
              const r = await verifyOtp(phone, code);
              setBusy(false);
              if (!r.ok) return setError(r.message ?? '인증번호가 맞지 않아요');
              nav('onboarding');
            }
          }}
        >
          <span className="auth__logo" aria-hidden>T</span>
          <h1 className="auth__title">
            나와 취향이 비슷한 사람의
            <br />
            꿀팁만 모아 보세요
          </h1>
          <label className="field" htmlFor="auth-phone">
            <span className="field__label">휴대폰 번호</span>
            <input
              id="auth-phone"
              className="input"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={phone}
              disabled={sent}
              onChange={(e) => setPhone(fmt(e.target.value))}
            />
          </label>
          {sent && (
            <label className="field" htmlFor="auth-code">
              <span className="field__label">인증번호</span>
              <input
                id="auth-code"
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6자리"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
          )}
          {info && !error && <p className="auth__info">{info}</p>}
          {error && <p className="auth__error" role="alert">{error}</p>}
          <Button variant="primary" type="submit" disabled={busy || (!sent ? !phoneOk : code.length !== 6)}>
            {busy ? '확인 중...' : sent ? '확인' : '인증번호 받기'}
          </Button>
          {sent && (
            <button type="button" className="text-btn auth__help" onClick={() => setHelp(true)}>
              인증 번호를 못 받으셨나요?
            </button>
          )}
          {!isLive && <p className="auth__mode">예시 모드 — 서버 연결 전이라 인증번호 123456으로 통과해요</p>}
        </form>
      </main>

      {/* BottomSheet_Code_Support */}
      <BottomSheet open={help} onClose={() => setHelp(false)}>
        <div className="sheet__content">
          <p className="sheet__heading"><b className="accent">인증 번호</b>를 못 받으셨나요?</p>
          <ul className="caution-list">
            <li>휴대폰의 문자 스팸함을 확인해주세요</li>
            <li>스팸 차단 앱을 확인해주세요</li>
            <li>가입된 부가서비스 중 스팸 관련 부가서비스가 있는지 확인해주세요</li>
            <li>
              스팸함을 확인해도 계속해서 인증 번호가 오지 않으시거나 궁금하신 점이 있으시다면 고객센터{' '}
              <span className="link-text">support@twinsy.co.kr</span>로 문의해 주세요
            </li>
          </ul>
        </div>
        <div className="sheet__btns">
          <Button variant="primary" onClick={() => setHelp(false)}>확인</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
