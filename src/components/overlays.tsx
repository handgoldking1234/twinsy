import { useState, type ReactNode } from 'react';
import type { AppUser } from '../data/world';
import { Avatar, BottomSheet, Button } from './ui';
import { Icon } from './Icon';

/* ---------- Dialog (DESIGN.md 4-5 Layer) ---------- */
export function Dialog({
  open,
  avatar,
  title,
  desc,
  cancel = '취소',
  confirm,
  destructive = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  avatar?: string;
  title: ReactNode;
  desc?: ReactNode;
  cancel?: string | null;
  confirm: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="dim dim--center" onClick={onCancel}>
      <section className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dialog__body">
          {avatar && <Avatar size={46} src={avatar} />}
          <p className="dialog__title">{title}</p>
          {desc && <div className="dialog__desc">{desc}</div>}
        </div>
        <div className="dialog__btns">
          {cancel && (
            <button type="button" className="dialog__btn" onClick={onCancel}>
              {cancel}
            </button>
          )}
          <button type="button" className={`dialog__btn ${destructive ? 'is-destructive' : 'is-primary'}`} onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------- 게시물 더보기 바텀시트 (BottomSheet_Settings_OthersPost_Option) ---------- */
export function PostOptionsSheet({
  author,
  following,
  onClose,
  onAction,
}: {
  author: AppUser | null;
  following: boolean;
  onClose: () => void;
  onAction: (a: 'share' | 'message' | 'unpick' | 'pick' | 'block' | 'report') => void;
}) {
  const items: { id: Parameters<typeof onAction>[0]; label: string }[] = [
    { id: 'share', label: '프로필 공유' },
    { id: 'message', label: '메시지 보내기' },
    following ? { id: 'unpick', label: '취향콕 취소' } : { id: 'pick', label: '취향콕 하기' },
    { id: 'block', label: '차단' },
    { id: 'report', label: '신고' },
  ];
  return (
    <BottomSheet open={Boolean(author)} onClose={onClose}>
      <ul className="action-list">
        {items.map((it) => (
          <li key={it.id}>
            <button type="button" className={`action-list__item ${it.id === 'block' || it.id === 'report' ? 'is-destructive' : ''}`} onClick={() => onAction(it.id)}>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/* ---------- 신고 바텀시트 (BottomSheet_Settings_ReportAccount) ---------- */
const REASONS = ['음란 · 성적 행위', '혐오 발언 · 상징', '사기 · 사칭', '폭력 · 괴롭힘', '아동 · 청소년 대상 성범죄', '스팸 · 유사투자자문', '지식재산권 침해'];

export function ReportSheet({ author, onClose, onSubmit }: { author: AppUser | null; onClose: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  return (
    <BottomSheet open={Boolean(author)} onClose={onClose}>
      <div className="sheet__content">
        <p className="sheet__heading">
          <b>{author?.name}</b> 님을 신고할까요?
        </p>
        <p className="sheet__sub">신고 사유를 선택하세요</p>
        <ul className="radio-list" role="radiogroup">
          {REASONS.map((r) => (
            <li key={r}>
              <button type="button" role="radio" aria-checked={reason === r} className="radio-list__item" onClick={() => setReason(r)}>
                <span className={`radio ${reason === r ? 'is-on' : ''}`} />
                {r}
              </button>
            </li>
          ))}
        </ul>
        <textarea
          id="report-memo"
          className="textbox"
          rows={4}
          placeholder="추가로 알려주실 내용이 있다면 작성해주세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        <p className="warn-text">
          <Icon name="warning" size={16} style={{ color: 'var(--color-point-primary)' }} />
          허위 신고 시 이용이 제한될 수 있으니 유의해 주세요.
        </p>
      </div>
      <div className="sheet__btns">
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button variant="primary" disabled={!reason} onClick={onSubmit}>신고</Button>
      </div>
    </BottomSheet>
  );
}
