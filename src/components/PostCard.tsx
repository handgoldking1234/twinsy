import type { Post } from '../data/mock';
import { Icon } from './Icon';
import { Avatar, ExpertBadge, IconCount, ImageBox, SoulBadge } from './ui';

/** Standard Post — DESIGN.md 4-3 순서: 작성자 → 제목 → 본문 → 이미지 → 꿀팁/핵심 → 메뉴평가 → 태그·위치 → 기능버튼 */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post">
      {/* 작성자 */}
      <div className="post__author">
        <Avatar size={34} src={post.avatar} />
        <div className="post__author-info">
          <div className="post__author-row">
            <strong className="post__name">{post.author}</strong>
            {post.soul && <SoulBadge />}
            {post.expert && <ExpertBadge label={post.expert} />}
          </div>
          <span className="post__time">{post.time}</span>
        </div>
        <button type="button" className="post__more" aria-label="더보기">
          <Icon name="more" />
        </button>
      </div>

      {/* 제목 + 본문 */}
      <div className="post__head">
        <h2 className="post__title">
          {post.title}
          {post.titleFlag && <Icon name="flag" size={16} className="post__flag" />}
        </h2>
        {post.body && <p className="post__body">{post.body}</p>}
      </div>

      {/* 이미지 캐러셀 */}
      <div className={`post__images ${post.images.length > 1 ? 'is-multi' : ''}`}>
        {post.images.map((img, i) => (
          <ImageBox key={i} ratio="322 / 382" src={img.src} alt={img.alt} className="post__image">
            {post.category && i === 0 && <span className="post__category">{post.category}</span>}
          </ImageBox>
        ))}
      </div>

      {/* My 꿀팁 */}
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

      {/* 핵심 Point (꿀단지형) */}
      {post.points && (
        <section className="post__tips">
          <div className="point-head">
            <h3 className="point-title point-title--key">
              핵심<span className="point-title__script">Point</span>
            </h3>
            <span className="point-head__line" />
            <button type="button" className="point-head__view">VIEW <Icon name="arrowRight" size={10} /></button>
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

      {/* 메뉴 평가 */}
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

      {/* 태그 · 위치 */}
      <div className="post__meta">
        <div className="post__tags">
          {post.tags.map((t) => (
            <button key={t} type="button" className="tag">#{t}</button>
          ))}
        </div>
        {post.location && (
          <button type="button" className="location">
            <Icon name="mapPin" />
            {post.location}
          </button>
        )}
      </div>

      {/* 기능 버튼 */}
      <div className="post__actions">
        <button type="button" className="chip-rate">
          <Icon name="thumbsUp" />
          꿀팁 <b>{post.honey}</b>
        </button>
        <div className="post__actions-right">
          <IconCount icon="link" count="Moa" label="모아" />
          <IconCount icon="chat" count={post.comments} label="댓글" />
          <IconCount icon="share" count={post.shares} label="공유" />
          <IconCount icon="save" label="저장" />
        </div>
      </div>
    </article>
  );
}
