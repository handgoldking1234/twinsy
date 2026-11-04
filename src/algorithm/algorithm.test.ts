import { describe, expect, it } from 'vitest';
import {
  accountTrust, bucketShares, freshness, inWindow, realtimeTop5, recommendFeed, risingKeywords,
  similarPeers, similarity, topicSearch, trustLevel, followingFeed, trustMap,
  type AlgoPost, type UserProfile,
} from './index';

const NOW = Date.parse('2026-11-04T21:00:00+09:00');
const H = 3_600_000;
const user = (id: string, food: Record<string, number> | undefined, extra: Partial<UserProfile> = {}): UserProfile => ({
  id, name: id, taste: food ? { 푸드: food } : {}, visits: {}, expertTopics: [], follows: [], ...extra,
});
const post = (id: string, authorId: string, ageH: number, extra: Partial<AlgoPost> = {}): AlgoPost => ({
  id, authorId, topic: '푸드', kind: 'normal', createdAt: NOW - ageH * H,
  metrics: { honey: 10, views: 100, viewsLastHour: 10, viewsPrevHour: 10, comments: 1, dwell: 30, saves: 1, shares: 1 },
  tasteTags: {}, keywords: ['떡볶이'], ...extra,
});

describe('최신성', () => {
  it('문서 예시값과 일치 (60일 ≈ 0.177, 2시간 ≈ 0.998)', () => {
    expect(freshness(NOW - 86_400 * 60_000, NOW)).toBeCloseTo(0.177, 2);
    expect(freshness(NOW - 120 * 60_000, NOW)).toBeCloseTo(0.998, 3);
  });
});

describe('유사 취향', () => {
  const me = user('me', { 매운맛: 0.9, 단맛: -0.6 });
  it('세부 취향이 같으면 +5, 다르면 -5', () => {
    const same = user('a', { 매운맛: 0.8, 단맛: -0.7 });
    const diff = user('b', { 매운맛: -0.8, 단맛: 0.7 });
    expect(similarity(me, same, '푸드')!).toBeGreaterThan(similarity(me, diff, '푸드')!);
    expect(similarity(me, same, '푸드')).toBe(100);
  });
  it('방문 평가가 같으면 유사율이 오른다', () => {
    const a = user('a', { 매운맛: 0.2, 단맛: 0.1 });
    const b = { ...a, id: 'b', visits: { 죠스떡볶이: 1 as const } };
    const me2 = { ...me, visits: { 죠스떡볶이: 1 as const } };
    expect(similarity(me2, b, '푸드')!).toBeGreaterThan(similarity(me2, a, '푸드')!);
  });
  it('상위 20%만 유사취향자 (10명 → 2명)', () => {
    const others = Array.from({ length: 10 }, (_, i) => user(`u${i}`, { 매운맛: 1 - i * 0.2, 단맛: -0.6 }));
    const peers = similarPeers(me, others, '푸드');
    expect(peers.size).toBe(2);
    expect([...peers.keys()]).toEqual(['u0', 'u1']);
  });
  it('취향 데이터가 없는 주제는 매칭하지 않는다', () => {
    expect(similarity(me, user('x', undefined), '푸드')).toBeNull();
  });
});

describe('계정 신뢰도', () => {
  it('-3 경고 문구, -6 경고 알림, -10 노출 제한', () => {
    expect(trustLevel(-2)).toBe('ok');
    expect(trustLevel(-3)).toBe('notice');
    expect(trustLevel(-6)).toBe('warning');
    expect(trustLevel(-10)).toBe('restricted');
  });
  it('취향과 반대 게시물은 -1, 유용성 평가가 많으면 감점 없음', () => {
    const a = user('a', { 매운맛: 0.9 });
    const posts = [
      post('p1', 'a', 1, { tasteTags: { 매운맛: -0.9 } }),
      post('p2', 'a', 1, { tasteTags: { 매운맛: -0.9 }, metrics: { ...post('x', 'a', 1).metrics, honey: 500 } }),
      post('p3', 'a', 1, { tasteTags: { 매운맛: 0.8 } }),
    ];
    expect(accountTrust(a, posts).total).toBe(-1);
  });
  it('신뢰도 -10 계정은 취향콕 피드에서도 빠진다', () => {
    const bad = user('bad', { 매운맛: 0.9 });
    const posts = Array.from({ length: 10 }, (_, i) => post(`b${i}`, 'bad', i, { tasteTags: { 매운맛: -1 } }));
    const me = user('me', { 매운맛: 0.9 }, { follows: ['bad'] });
    expect(followingFeed(me, posts, trustMap([bad, me], posts))).toHaveLength(0);
  });
});

describe('추천 피드', () => {
  it('기간 창: 최신순 48h, 트렌드 일반 49~120h·꿀단지 49~168h', () => {
    expect(inWindow(post('a', 'x', 47), 'latest', NOW)).toBe(true);
    expect(inWindow(post('a', 'x', 50), 'latest', NOW)).toBe(false);
    expect(inWindow(post('a', 'x', 130), 'trend', NOW)).toBe(false);
    expect(inWindow(post('a', 'x', 130, { kind: 'honey' }), 'trend', NOW)).toBe(true);
  });
  it('유사취향자 4개 + 전체 회원 2개를 번갈아 배치', () => {
    const me = user('me', { 매운맛: 0.9, 단맛: -0.6 });
    const peer = user('peer', { 매운맛: 0.9, 단맛: -0.6 });
    const others = Array.from({ length: 4 }, (_, i) => user(`o${i}`, { 매운맛: -0.9, 단맛: 0.6 }));
    const posts = [
      ...Array.from({ length: 6 }, (_, i) => post(`p${i}`, 'peer', i + 1)),
      ...Array.from({ length: 6 }, (_, i) => post(`a${i}`, `o${i % 4}`, i + 1)),
    ];
    const feed = recommendFeed(me, [me, peer, ...others], posts, { scope: { kind: 'all' }, sort: 'latest', now: NOW });
    expect(feed.slice(0, 6).map((r) => r.source)).toEqual(['peer', 'peer', 'peer', 'peer', 'all', 'all']);
  });
  it('일반 60 : 꿀단지 40 비율', () => {
    const me = user('me', undefined);
    const others = [user('o', undefined)];
    const posts = Array.from({ length: 10 }, (_, i) => post(`p${i}`, 'o', i + 1, { kind: i % 2 ? 'honey' : 'normal' }));
    const feed = recommendFeed(me, [me, ...others], posts, { scope: { kind: 'all' }, sort: 'latest', now: NOW });
    expect(feed.slice(0, 5).filter((r) => r.post.kind === 'normal')).toHaveLength(3);
  });
});

describe('검색', () => {
  it('급상승 키워드: 누적량보다 변화율, 봇·반복 검색 제외', () => {
    const logs = [
      ...Array.from({ length: 50 }, (_, i) => ({ userId: `u${i}`, keyword: '김치', at: NOW - 1.5 * H })),
      ...Array.from({ length: 40 }, (_, i) => ({ userId: `u${i}`, keyword: '김치', at: NOW - 0.5 * H })),
      ...Array.from({ length: 20 }, (_, i) => ({ userId: `v${i}`, keyword: '두쫀쿠', at: NOW - 0.2 * H })),
      ...Array.from({ length: 30 }, () => ({ userId: 'bot', keyword: '광고', at: NOW - 0.1 * H, isBot: true })),
      ...Array.from({ length: 30 }, () => ({ userId: 'same', keyword: '반복', at: NOW - 0.1 * H })),
    ];
    const top = risingKeywords(logs, NOW);
    expect(top[0].keyword).toBe('두쫀쿠');
    expect(top.find((k) => k.keyword === '광고')).toBeUndefined();
    expect(top.find((k) => k.keyword === '반복')!.lastHour).toBe(1);
  });
  it('Top5: 맨 앞 3번 노출된 게시물은 1~2위에서 배제, 이전 노출 게시물은 3~5위에서 배제', () => {
    const posts = Array.from({ length: 8 }, (_, i) =>
      post(`h${i}`, 'x', i + 1, { kind: 'honey', metrics: { ...post('x', 'x', 1).metrics, honey: 100 - i * 10 } }));
    const top = realtimeTop5('떡볶이', posts, NOW, { frontCount: { h0: 3 }, shownBefore: new Set(['h3']) });
    expect(top).toHaveLength(5);
    expect(top.map((r) => r.post.id)).not.toContain('h3');
    expect(top[0].post.id).toBe('h1');
    expect(top.slice(0, 2).every((r) => r.criteria === 'A')).toBe(true);
  });
  it('검색 비중 규칙과 4개 단위 C3 + D1, 노출 3회 제한', () => {
    expect(bucketShares(true, true)).toEqual({ peer: 0.4, expert: 0.4, general: 0.2 });
    expect(bucketShares(true, false).peer).toBe(0.8);
    expect(bucketShares(false, true).expert).toBe(0.8);
    expect(bucketShares(false, false).general).toBe(1);
    const me = user('me', { 매운맛: 0.9 });
    const u = [me, user('o', { 매운맛: 0.9 })];
    const posts = Array.from({ length: 8 }, (_, i) => post(`p${i}`, 'o', i + 1));
    const res = topicSearch(me, u, posts, '떡볶이', { now: NOW, impressions: { p0: 3 } });
    expect(res.map((r) => r.post.id)).not.toContain('p0');
    expect(res.map((r) => r.criteria).slice(0, 4)).toEqual(['C', 'C', 'C', 'D']);
  });
});

import { exposureStage, minExposure, sampleSize, underExposedBoostHours, accountTrust as trustAt } from './index';

describe('노출 단계', () => {
  it('최소 노출 수: 초기엔 유사취향자 전원, DAU 1,000 이상이면 7%', () => {
    expect(minExposure(500, 40)).toBe(40);
    expect(minExposure(10_000, 40)).toBe(700);
  });
  it('샘플 그룹은 DAU의 1% (30~300명)', () => {
    expect(sampleSize(1_000)).toBe(30);
    expect(sampleSize(10_000)).toBe(100);
    expect(sampleSize(100_000)).toBe(300);
  });
  it('샘플 반응이 좋으면 전체로 확장, 나쁘면 유사취향자 안에서만', () => {
    expect(exposureStage({ impressions: 50, engaged: 2 }, 10_000)).toBe('sample');
    expect(exposureStage({ impressions: 200, engaged: 30 }, 10_000)).toBe('all');
    expect(exposureStage({ impressions: 200, engaged: 6 }, 10_000)).toBe('peers');
  });
  it('최소 노출에 못 미치면 최신순에서 끌어올림', () => {
    expect(underExposedBoostHours({ impressions: 0, engaged: 0 }, 10_000, 40)).toBe(6);
    expect(underExposedBoostHours({ impressions: 700, engaged: 0 }, 10_000, 40)).toBe(0);
  });
  it('노출 제한은 -10 도달 후 30일이 지나면 풀린다', () => {
    const a = user('a', { 매운맛: 0.9 });
    const posts = Array.from({ length: 10 }, (_, i) => post(`c${i}`, 'a', 100 - i, { tasteTags: { 매운맛: -1 } }));
    expect(trustAt(a, posts, NOW).level).toBe('restricted');
    const later = NOW + 31 * 86_400_000;
    const t = trustAt(a, posts, later);
    expect(t.lifted).toBe(true);
    expect(t.level).toBe('warning');
  });
});
