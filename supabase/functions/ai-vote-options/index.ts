// AI 투표 보기 생성 — 정보 신뢰성 3단계 검증의 1단계 (AI가 객관식 보기 생성)
// 입력: { question: string }  출력: { options: string[] }
import { askClaude, cors, json, parseJson } from '../_shared/db.ts';

const SYSTEM = `너는 트윈지(Twinsy)의 투표 보기 생성 도우미다.
질문을 읽고 실제 경험자들이 고르기 쉬운 객관식 보기를 3~4개 만든다.
보기는 서로 겹치지 않고, 각 20자 이내, 존댓말 없이 짧게 쓴다.
반드시 {"options": ["...", "..."]} JSON 하나만 출력한다.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { question } = (await req.json()) as { question: string };
    if (!question?.trim()) return json({ error: 'question이 필요합니다' }, 400);
    const text = await askClaude(SYSTEM, question.slice(0, 200), 200);
    const { options } = parseJson<{ options: string[] }>(text);
    return json({ options: options.slice(0, 4) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
