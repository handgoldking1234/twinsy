/**
 * 앱 상태 — 로그인 사용자(나), 취향콕 목록, 관심콕, 알고리즘 점수 보기.
 * 실제 서비스에서는 Supabase 등 서버 데이터로 바뀌는 부분.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isLive } from '../lib/supabase';
import { loadLiveWorld, recordImpressions, saveFollow, saveTaste } from './repo';
import { similarPeers, trustMap, type AccountTrust, type RankedPost } from '../algorithm';
import { ME, NOW, USERS, userById, type AppPost, type AppUser, POSTS } from './world';

export type PostView = {
  post: AppPost;
  author: AppUser;
  soul: boolean;           // 나와 취향이 비슷한 멤버(유사취향자) 배지
  expertLabel?: string;    // 이 주제 전문가 배지
  timeLabel: string;
  rank?: RankedPost;
};

type Store = {
  me: AppUser;
  users: AppUser[];
  posts: AppPost[];
  trusts: Map<string, AccountTrust>;
  setMe: (u: AppUser) => void;
  toggleFollow: (id: string) => void;
  interests: string[];
  setInterests: (t: string[]) => void;
  debug: boolean;
  setDebug: (v: boolean) => void;
  view: (p: AppPost, rank?: RankedPost) => PostView;
  /** 어느 주제에서든 나의 유사취향자인가 */
  isPeer: (userId: string) => boolean;
  /** 주제별 유사율 (나 기준) */
  peersByTopic: Map<string, Map<string, number>>;
  impressions: Record<string, number>;
  addImpressions: (ids: string[]) => void;
  /** 서버 데이터 상태: 예시(mock) / 불러오는 중 / 서버 / 오류 */
  source: 'mock' | 'loading' | 'live' | 'error';
  blocked: string[];
  block: (id: string) => void;
  unblock: (id: string) => void;
  /** 삭제한 내 게시물 (15일 보관) */
  deleted: string[];
  deletePost: (id: string) => void;
  /** 비공개로 돌린 내 게시물 */
  privatePosts: string[];
  togglePrivate: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export const timeAgo = (t: number) => {
  const m = Math.max(1, Math.round((NOW - t) / 60_000));
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
};

export const countLabel = (n: number) => (n >= 10_000 ? `${(n / 10_000).toFixed(1).replace('.0', '')}만` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}천` : `${n}`);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<AppUser>(ME);
  const [interests, setInterests] = useState<string[]>(['푸드', '여행']);
  const [debug, setDebug] = useState(false);
  const [impressions, setImpressions] = useState<Record<string, number>>({});
  const [blocked, setBlocked] = useState<string[]>(['adking']);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [privatePosts, setPrivatePosts] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [source, setSource] = useState<Store['source']>(isLive ? 'loading' : 'mock');

  useEffect(() => {
    if (!isLive) return;
    loadLiveWorld()
      .then((r) => {
        const live = r?.meId ? USERS.find((u) => u.id === r.meId) : undefined;
        if (live) setMeState(live);
        setSource('live');
        setVersion((v) => v + 1);
      })
      .catch((e) => {
        console.warn('Supabase 데이터를 불러오지 못해 예시 데이터로 보여 줍니다', e);
        setSource('error');
      });
  }, []);

  const users = useMemo(() => USERS.map((u) => (u.id === me.id ? me : u)), [me, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const trusts = useMemo(() => trustMap(users, POSTS, isLive ? Date.now() : NOW), [users]);
  const peersByTopic = useMemo(() => {
    const topics = new Set(POSTS.map((p) => p.topic));
    return new Map([...topics].map((t) => [t, similarPeers(me, users, t)]));
  }, [me, users]);

  const visiblePosts = useMemo(() => POSTS.filter((p) => !deleted.includes(p.id)), [deleted, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const store: Store = {
    me,
    users,
    posts: visiblePosts,
    blocked,
    block: (id) => setBlocked((b) => (b.includes(id) ? b : [...b, id])),
    unblock: (id) => setBlocked((b) => b.filter((x) => x !== id)),
    deleted,
    deletePost: (id) => setDeleted((d) => [...d, id]),
    privatePosts,
    togglePrivate: (id) => setPrivatePosts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    trusts,
    source,
    setMe: (u) => {
      setMeState(u);
      void saveTaste(u.id, u.taste);
    },
    toggleFollow: (id) =>
      setMeState((m) => {
        const on = !m.follows.includes(id);
        void saveFollow(m.id, id, on);
        return { ...m, follows: on ? [...m.follows, id] : m.follows.filter((f) => f !== id) };
      }),
    interests,
    setInterests,
    debug,
    setDebug,
    impressions,
    addImpressions: (ids) => {
      void recordImpressions(ids, 'search');
      setImpressions((s) => {
        const n = { ...s };
        ids.forEach((id) => (n[id] = (n[id] ?? 0) + 1));
        return n;
      });
    },
    peersByTopic,
    isPeer: (id) => [...peersByTopic.values()].some((m) => m.has(id)),
    view: (p, rank) => {
      const author = userById.get(p.authorId)!;
      return {
        post: p,
        author,
        soul: Boolean(me.taste[p.topic] && peersByTopic.get(p.topic)?.has(author.id)),
        expertLabel: author.expertTopics.includes(p.topic) ? author.expertLabel : undefined,
        timeLabel: timeAgo(p.createdAt),
        rank,
      };
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 밖에서 useStore를 썼습니다');
  return s;
}
