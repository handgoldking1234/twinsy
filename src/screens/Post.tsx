import { useState } from 'react';
import { Icon } from '../components/Icon';
import { PostCard } from '../components/PostCard';
import { Avatar, BottomNav, BottomSheet, Button, SubHeader, Toast } from '../components/ui';
import { Dialog } from '../components/overlays';
import { contradictsAuthor } from '../algorithm';
import { useStore } from '../data/store';
import { TOPICS } from '../data/mock';
import { CHATS, postById, userById } from '../data/world';
import type { Nav } from '../App';

/** 게시물 상세 — 꿀단지는 요약 → 상세(핵심 Point 펼침) + 댓글 */
export function PostDetailScreen({ nav, postId }: { nav: Nav; postId?: string }) {
  const s = useStore();
  const post = postById.get(postId ?? '') ?? s.posts[0];
  const v = s.view(post);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { userId: 'ronnyoon', text: '정리 감사해요! 저장해 갑니다', time: '10분 전' },
    { userId: 'blues', text: '주말에 가 봐야겠네요', time: '32분 전' },
  ]);
  const mine = post.authorId === s.me.id;
  const isPrivate = s.privatePosts.includes(post.id);
  const [sheet, setSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="screen">
      <SubHeader
        title={post.kind === 'honey' ? '꿀단지' : '게시물'}
        onBack={() => history.length > 1 ? history.back() : nav('main-pick')}
        right={<button type="button" className="sub-header__btn" aria-label="공유"><Icon name="share" /></button>}
      />
      <main className="screen__body">
        {mine && isPrivate && <p className="trust-banner">비공개 게시물이에요. 나만 볼 수 있어요</p>}
        <PostCard v={v} onTag={(t) => nav('search', t)} onMore={mine ? () => setSheet(true) : undefined} />
        <section className="comments">
          <h2 className="list-subtitle">댓글 {post.metrics.comments + comments.length - 2}</h2>
          <ul className="comment-list">
            {comments.map((c, i) => {
              const u = userById.get(c.userId) ?? s.me;
              return (
                <li key={i} className="comment">
                  <Avatar size={30} src={u.avatar} />
                  <div className="comment__body">
                    <p className="comment__head"><b>{u.name}</b><span>{c.time}</span></p>
                    <p className="comment__text">{c.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          setComments((cs) => [{ userId: s.me.id, text: comment.trim(), time: '방금' }, ...cs]);
          setComment('');
        }}
      >
        <input id="comment-input" className="composer__input" placeholder="댓글을 남겨 보세요" value={comment} onChange={(e) => setComment(e.target.value)} />
        <button type="submit" className="composer__send" disabled={!comment.trim()}>등록</button>
      </form>

      {/* BottomSheet_Settings_MyPost_Open/Hidden_Option */}
      <BottomSheet open={sheet} onClose={() => setSheet(false)}>
        <ul className="action-list">
          <li><button type="button" className="action-list__item" onClick={() => { setSheet(false); nav('write'); }}>수정</button></li>
          <li>
            <button type="button" className="action-list__item" onClick={() => { s.togglePrivate(post.id); setSheet(false); setToast(isPrivate ? '게시물을 공개했어요' : '게시물을 비공개로 돌렸어요'); window.setTimeout(() => setToast(null), 1600); }}>
              {isPrivate ? '공개' : '비공개'}
            </button>
          </li>
          <li><button type="button" className="action-list__item is-destructive" onClick={() => { setSheet(false); setConfirmDelete(true); }}>삭제</button></li>
        </ul>
      </BottomSheet>
      <Dialog
        open={confirmDelete}
        title="이 게시물을 삭제하시겠어요?"
        desc="삭제된 게시물은 삭제일 기준 15일간 보관되며, 이후에는 영구 삭제되어 복원할 수 없습니다."
        confirm="삭제"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          setLoading('삭제 중...');
          window.setTimeout(() => {
            s.deletePost(post.id);
            setLoading(null);
            nav('profile');
          }, 900);
        }}
      />
      {loading && (
        <div className="dim dim--center dim--light">
          <div className="loading" role="status"><span className="loading__spin" />{loading}</div>
        </div>
      )}
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}

/** 작성 — 일반(사진·영상·최대 500자) / 꿀단지(중간 길이 + 핵심 Point) */
export function WriteScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const [kind, setKind] = useState<'normal' | 'honey'>('normal');
  const [topic, setTopic] = useState('푸드');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tips, setTips] = useState(['']);
  const [toast, setToast] = useState<string | null>(null);
  const limit = kind === 'normal' ? 500 : 2000;

  // 기본 취향과 반대되는 글인지 미리 알려 준다 (계정 신뢰도 규칙)
  const spicyWords = /매운|맵|불닭|마라/.test(title + body);
  const sweetWords = /달달|디저트|단맛|케이크/.test(title + body);
  const tasteTags: Record<string, number> = {};
  if (spicyWords) tasteTags['매운맛'] = 1;
  if (sweetWords) tasteTags['단맛'] = 1;
  const contradicts =
    Object.keys(tasteTags).length > 0 &&
    contradictsAuthor(
      { id: 'draft', authorId: s.me.id, topic, kind, createdAt: 0, keywords: [], tasteTags,
        metrics: { honey: 0, views: 0, viewsLastHour: 0, viewsPrevHour: 0, comments: 0, dwell: 0, saves: 0, shares: 0 } },
      s.me,
    );

  return (
    <div className="screen">
      <SubHeader title="게시물 작성" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <form
          className="write"
          onSubmit={(e) => {
            e.preventDefault();
            setToast('게시물을 올렸어요');
            window.setTimeout(() => nav('profile'), 1200);
          }}
        >
          <div className="seg seg--full" role="radiogroup" aria-label="게시물 종류">
            <button type="button" role="radio" aria-checked={kind === 'normal'} className={`seg__item ${kind === 'normal' ? 'is-active' : ''}`} onClick={() => setKind('normal')}>
              일반 · 요약
            </button>
            <button type="button" role="radio" aria-checked={kind === 'honey'} className={`seg__item ${kind === 'honey' ? 'is-active' : ''}`} onClick={() => setKind('honey')}>
              꿀단지 · 노하우
            </button>
          </div>

          <label className="field">
            <span className="field__label">주제</span>
            <select id="write-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          <button type="button" className="photo-add">
            <Icon name="write" size={22} />
            사진·영상 추가 <span>0/10</span>
          </button>

          <label className="field">
            <span className="field__label">제목</span>
            <input id="write-title" className="input" placeholder="예) 음식점#가게 이름" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
          </label>

          <label className="field">
            <span className="field__label">내용 <em>{body.length}/{limit}</em></span>
            <textarea id="write-body" className="textbox" rows={6} maxLength={limit} placeholder="경험을 짧게 정리해 주세요" value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          <fieldset className="field">
            <legend className="field__label"><span className="point-title__script">My</span> 꿀팁</legend>
            {tips.map((t, i) => (
              <input
                key={i}
                id={`write-tip-${i}`}
                className="input"
                placeholder={`꿀팁 ${i + 1}`}
                value={t}
                onChange={(e) => setTips((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
            {tips.length < 6 && (
              <button type="button" className="text-btn" onClick={() => setTips((xs) => [...xs, ''])}>+ 꿀팁 추가</button>
            )}
          </fieldset>

          <div className="field field--row">
            <span className="field__label">위치 인증</span>
            <button type="button" className="location"><Icon name="mapPin" />현재 위치로 인증</button>
          </div>

          {contradicts && (
            <p className="notice-box">
              <Icon name="warning" size={16} style={{ color: 'var(--color-point-primary)' }} />
              등록한 기본 취향과 다른 내용이에요. 취향과 반대되는 게시물이 쌓이면 이 주제의 계정 신뢰도가 낮아져요. 취향이 바뀌었다면 [설정 &gt; 취향 테스트]에서 변경해 주세요.
            </p>
          )}

          <Button variant="primary" type="submit" disabled={!title.trim() || !body.trim()}>올리기</Button>
        </form>
      </main>
      <BottomNav active="write" nav={nav} />
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}

/** 메시지 목록 / 대화방 */
export function MessagesScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  return (
    <div className="screen">
      <SubHeader title="메시지" />
      <main className="screen__body">
        <ul className="chat-list">
          {CHATS.map((c) => {
            const u = userById.get(c.userId)!;
            return (
              <li key={c.id}>
                <button type="button" className="chat-item" onClick={() => nav('chat', u.id)}>
                  <Avatar size={44} src={u.avatar} />
                  <span className="chat-item__body">
                    <span className="chat-item__name">{u.name} {s.isPeer(u.id) && <span className="chat-item__soul">유사취향</span>}</span>
                    <span className="chat-item__last">{c.last}</span>
                  </span>
                  <span className="chat-item__side">
                    <span className="chat-item__time">{c.time}</span>
                    {c.unread > 0 && <span className="chat-item__badge">{c.unread}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav active="message" nav={nav} />
    </div>
  );
}

export function ChatScreen({ nav, userId }: { nav: Nav; userId?: string }) {
  const u = userById.get(userId ?? '') ?? userById.get('leehappy')!;
  const chat = CHATS.find((c) => c.userId === u.id);
  const [msgs, setMsgs] = useState(chat?.messages ?? []);
  const [text, setText] = useState('');
  return (
    <div className="screen">
      <SubHeader title={u.name} onBack={() => nav('messages')} />
      <main className="screen__body chat">
        {msgs.length === 0 && <p className="empty-line">{u.name} 님에게 첫 메시지를 보내 보세요</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`bubble-row ${m.mine ? 'is-mine' : ''}`}>
            {!m.mine && <Avatar size={30} src={u.avatar} />}
            <p className="bubble">{m.text}</p>
            <span className="bubble__time">{m.time}</span>
          </div>
        ))}
      </main>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setMsgs((m) => [...m, { mine: true, text: text.trim(), time: '방금' }]);
          setText('');
        }}
      >
        <input id="chat-input" className="composer__input" placeholder="메시지 입력" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="composer__send" disabled={!text.trim()}>
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}
