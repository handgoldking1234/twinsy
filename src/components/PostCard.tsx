import { useState } from 'react';
import type { PostView } from '../data/store';
import { countLabel, useStore } from '../data/store';
import { Icon } from './Icon';
import { Avatar, ExpertBadge, IconCount, ImageBox, SoulBadge } from './ui';

const SOURCE_LABEL = { peer: '유사취향자', all: '전체 회원', following: '취향콕' } as const;
const BUCKET_LABEL = { peer: '유사취향자', expert: '전문가', general: '일반' } as const;

/** 알고리즘 점수 보기 (미리보기 전용) */
export function ScoreChip({ v }: { v: PostView }) {
  const { debug } = useStore();
  if (!debug || !v.rank) return null;
  const r = v.rank;
  const who = r.bucket ? BUCKET_LABEL[r.bucket] : r.source ? SOURCE_LABEL[r.source] : '';
  const score = r.criteria === 'latest' || r.source === 'following' ? '' : ` · ${r.score.toFixed(3)}`;
  return (
    <span className="score-chip">
      {who}
      {r.similarity !== undefined && ` ${Math.round(r.similarity)}%`} · {r.criteria === 'latest' ? '최신순' : r.criteria === 'trend' ? '트렌드' : `${r.criteria} 기준`}
      {score} · {v.post.kind === 'honey' ? '꿀단지' : '일반'}
    </span>
  );
}

function AuthorRow({ v, onMore }: { v: PostView; onMore?: () => void }) {
  return (
    <div className="post__author">
      <Avatar size={34} src={v.author.avatar} />
      <div className="post__author-info">
        <div className="post__author-row">
          <strong className="post__name">{v.author.name}</strong>
          {v.soul && <SoulBadge />}
          {v.expertLabel && <ExpertBadge label={v.expertLabel} />}
        </div>
        <span className="post__time">{v.timeLabel}</span>
      </div>
      {onMore && (
        <button type="button" className="post__more" aria-label="더보기" onClick={onMore}>
          <Icon name="more" />
        </button>
      )}
    </div>
  );
}

/** Standard Post — DESIGN.md 4-3 순서: 작성자 → 제목 → 본문 → 이미지 → 꿀팁/핵심 → 메뉴평가 → 태그·위치 → 기능버튼 */
export function PostCard({ v, onMore, onOpen, onTag }: { v: PostView; onMore?: () => void; onOpen?: () => void; onTag?: (t: string) => void }) {
  const post = v.post;
  const [honeyed, setHoneyed] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post">
      <AuthorRow v={v} onMore={onMore} />
      <ScoreChip v={v} />

      <div className="post__head">
        <h2 className="post__title">
          <button type="button" className="post__title-btn" onClick={onOpen}>
            {post.title}
          </button>
          {post.titleFlag && <Icon name="flag" size={16} className="post__flag" />}
        </h2>
        {post.body && <p className="post__body">{post.body}</p>}
      </div>

      {post.images.length > 0 && (
        <div className={`post__images ${post.images.length > 1 ? 'is-multi' : ''}`}>
          {post.images.map((img, i) => (
            <ImageBox key={i} ratio="322 / 382" src={img.src} alt={img.alt} className="post__image">
              {post.kind === 'honey' && i === 0 && <span className="post__category">꿀단지</span>}
            </ImageBox>
          ))}
        </div>
      )}

      {post.tips && (
        <section className="post__tips">
          <h3 className="point-title">
            <span className="point-title__script">My</span>꿀팁
          </h3>
          <ul className="tip-list">
            {post.tips.map((t, i) => (
              <li key={i} className="tip-list__item">
                <span className="tip-list__bullet">-</span>
                <span>
                  {t.text}
                  {t.strong && <b>{t.strong}</b>}
                  {t.after}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {post.points && (
        <section className="post__tips">
          <div className="point-head">
            <h3 className="point-title point-title--key">
              핵심<span className="point-title__script">Point</span>
            </h3>
            <span className="point-head__line" />
            <button type="button" className="point-head__view" onClick={onOpen}>
              VIEW <Icon name="arrowRight" size={10} />
            </button>
          </div>
          <ol className="point-list">
            {post.points.map((p) => (
              <li key={p.title}>
                <strong className="point-list__title">{p.title}</strong>
                {p.lines.map((l) => (
                  <p key={l} className="point-list__line">- {l}</p>
                ))}
              </li>
            ))}
          </ol>
        </section>
      )}

      {post.menus && (
        <div className="menu-rate">
          {post.menus.map((m) => (
            <div key={m.name} className="menu-rate__item">
              <p className="menu-rate__name">
                {m.name}
                <Icon name="thumbsUp" size={16} style={{ color: m.best ? 'var(--color-brown600)' : 'var(--color-text-secondary)' }} />
              </p>
              <p className="menu-rate__comment">{m.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="post__meta">
        <div className="post__tags">
          {post.tags.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => onTag?.(t)}>#{t}</button>
          ))}
        </div>
        {post.location && (
          <button type="button" className="location">
            <Icon name="mapPin" />
            {post.location}
          </button>
        )}
      </div>

      <div className="post__actions">
        <button
          type="button"
          className={`chip-rate ${honeyed ? 'is-on' : ''}`}
          aria-pressed={honeyed}
          onClick={() => setHoneyed((h) => !h)}
        >
          <Icon name="thumbsUp" />
          꿀팁 <b>{countLabel(post.metrics.honey + (honeyed ? 1 : 0))}</b>
        </button>
        <div className="post__actions-right">
          <IconCount icon="link" count="Moa" label="모아" />
          <IconCount icon="chat" count={countLabel(post.metrics.comments)} label="댓글" />
          <IconCount icon="share" count={countLabel(post.metrics.shares)} label="공유" />
          <button type="button" className={`icon-count ${saved ? 'is-on' : ''}`} aria-label="저장" aria-pressed={saved} onClick={() => setSaved((s) => !s)}>
            <Icon name="save" style={saved ? { fill: 'currentColor' } : undefined} />
          </button>
        </div>
      </div>
    </article>
  );
}

/** 검색 결과·리스트용 가로형 카드 */
export function PostRow({ v, onOpen, rankNo }: { v: PostView; onOpen?: () => void; rankNo?: number }) {
  const p = v.post;
  return (
    <button type="button" className="post-row" onClick={onOpen}>
      {rankNo !== undefined && <span className="post-row__rank">{rankNo}</span>}
      <ImageBox ratio="1 / 1" src={p.images[0]?.src} alt={p.images[0]?.alt} className="post-row__thumb" />
      <span className="post-row__body">
        <span className="post-row__title">{p.title}</span>
        <span className="post-row__meta">
          <span className="post-row__author">{v.author.name}</span>
          {v.soul && <SoulBadge />}
          {v.expertLabel && <ExpertBadge label={v.expertLabel} />}
        </span>
        <span className="post-row__stats">
          꿀팁 {countLabel(p.metrics.honey)} · 댓글 {countLabel(p.metrics.comments)} · {v.timeLabel}
        </span>
        <ScoreChip v={v} />
      </span>
    </button>
  );
}
