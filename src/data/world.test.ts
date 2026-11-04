import { describe, expect, it } from 'vitest';
import { followingFeed, realtimeTop5, recommendFeed, risingKeywords, trustMap } from '../algorithm';
import { ME, NOW, POSTS, SEARCH_LOGS, TOP5_HISTORY, USERS } from './world';

const trusts = trustMap(USERS, POSTS);

describe('예시 데이터에서 알고리즘 결과', () => {
  it('취향 반대 게시물을 반복한 계정: toolineAA_bob 경고 문구, deal_king99 노출 제한', () => {
    expect(trusts.get('tooline')!.level).toBe('notice');
    expect(trusts.get('adking')!.level).toBe('restricted');
    expect(trusts.get('leehappy')!.total).toBe(0);
  });
  it('추천 피드에 노출 제한 계정 게시물이 없다', () => {
    const feed = recommendFeed(ME, USERS, POSTS, { scope: { kind: 'all' }, sort: 'latest', now: NOW, trusts });
    expect(feed.length).toBeGreaterThan(5);
    expect(feed.some((r) => r.post.authorId === 'adking')).toBe(false);
    expect(feed[0].source).toBe('peer');
  });
  it('취향콕 탭은 팔로잉한 사람 게시물 최신순', () => {
    const feed = followingFeed(ME, POSTS, trusts);
    expect(feed.every((r) => ME.follows.includes(r.post.authorId))).toBe(true);
    expect(feed[0].post.createdAt).toBeGreaterThanOrEqual(feed[1].post.createdAt);
  });
  it('실시간 Top5: 광고·봇 키워드 제외, 1위 키워드에 꿀단지가 있다', () => {
    const rising = risingKeywords(SEARCH_LOGS, NOW);
    expect(rising.map((k) => k.keyword)).not.toContain('할인쿠폰');
    expect(rising.map((k) => k.keyword)).not.toContain('매크로');
    expect(realtimeTop5(rising[0].keyword, POSTS, NOW, TOP5_HISTORY).length).toBeGreaterThan(0);
  });
});
