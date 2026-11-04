import { useMemo } from 'react';
import { SubHeader } from '../components/ui';
import { risingKeywords, similarity, TRUST_MESSAGE } from '../algorithm';
import { useStore } from '../data/store';
import { NOW, SEARCH_LOGS } from '../data/world';
import type { Nav } from '../App';

const LEVEL = { ok: '정상', notice: '경고 문구', warning: '경고 알림', restricted: '노출 제한' } as const;

/** 알고리즘 확인용 화면 (미리보기 전용) — 유사율·유사취향자·계정 신뢰도·급상승 키워드 */
export function AlgoScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const topics = Object.keys(s.me.taste);
  const rising = useMemo(() => risingKeywords(SEARCH_LOGS, NOW, 8), []);

  return (
    <div className="screen">
      <SubHeader title="알고리즘 확인" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <div className="algo">
          <section>
            <h2 className="algo__title">나({s.me.name}) 기준 주제별 유사율</h2>
            <p className="algo__note">설문 유사율 + 세부 취향 ±5 + 방문 평가 ±5. 굵은 값이 상위 20% 유사취향자.</p>
            <div className="table-wrap">
              <table className="algo-table">
                <thead>
                  <tr><th>사용자</th>{topics.map((t) => <th key={t}>{t}</th>)}</tr>
                </thead>
                <tbody>
                  {s.users.filter((u) => u.id !== s.me.id).map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      {topics.map((t) => {
                        const v = similarity(s.me, u, t);
                        const peer = s.peersByTopic.get(t)?.has(u.id);
                        return <td key={t} className={peer ? 'is-peer' : ''}>{v === null ? '–' : `${Math.round(v)}%`}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="algo__title">계정 신뢰도</h2>
            <p className="algo__note">기본 취향과 반대 게시물 1건당 -1 (꿀팁 평가 100개 이상이면 감점 없음).</p>
            <div className="table-wrap">
              <table className="algo-table">
                <thead><tr><th>사용자</th><th>점수</th><th>상태</th><th>주제별</th></tr></thead>
                <tbody>
                  {s.users.map((u) => {
                    const t = s.trusts.get(u.id)!;
                    return (
                      <tr key={u.id} title={TRUST_MESSAGE[t.level] ?? ''}>
                        <td>{u.name}</td>
                        <td>{t.total}</td>
                        <td className={`lvl lvl--${t.level}`}>{LEVEL[t.level]}</td>
                        <td>{Object.entries(t.byTopic).map(([k, v]) => `${k} ${v}`).join(', ') || '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="algo__title">급상승 키워드 (최근 1시간 vs 직전 1시간)</h2>
            <p className="algo__note">변화율 50% + 검색량 30% + 시간 가중치 20%. 봇·광고·반복 검색 제외.</p>
            <div className="table-wrap">
              <table className="algo-table">
                <thead><tr><th>순위</th><th>키워드</th><th>직전</th><th>최근</th><th>변화율</th><th>점수</th></tr></thead>
                <tbody>
                  {rising.map((k, i) => (
                    <tr key={k.keyword}>
                      <td>{i + 1}</td><td>{k.keyword}</td><td>{k.prevHour}</td><td>{k.lastHour}</td>
                      <td>{Math.round(k.change * 100)}%</td><td>{k.score.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
