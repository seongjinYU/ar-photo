// token → 미디어 목록 조회 (파일명 = 매핑이라 목록에서 찾기만 하면 됨)
// 한 카드(token)에 여러 장을 붙여두면 뷰어에서 페이지로 넘겨본다.
//
//   clips/<token>.<ext>            → 사진(png·jpg) / 영상(mp4·mov)
//   clips/<token>.<slot>.<ext>     → 같은 종류를 여러 개 넣을 때. slot에 'green'이 들어가면
//                                    그린스크린 누끼 클립으로 취급(액자 없이 피사체만 세움)
import { list } from '@vercel/blob';

const KIND = { mp4: 'video', mov: 'video', png: 'image', jpg: 'image', jpeg: 'image' };
const ORDER = { image: 0, video: 1, chroma: 2 };   // 사진 → 영상 → 누끼 순으로 페이지

export default async function handler(req, res) {
  const t = String(req.query.t || '').toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(t)) return res.status(400).json({ error: 'bad token' });

  const { blobs } = await list({ prefix: `clips/${t}.`, limit: 20 });
  res.setHeader('cache-control', 'no-store');      // 재촬영 즉시 반영
  // 배정은 어드민에서만 한다. 빈 카드는 404 → 뷰어가 '영상 준비 중…' 표시하며 재시도.
  // (구 부스 플로우의 '첫 스캔 바인딩'은 어드민 배정과 충돌해 제거 — 빈 카드가 현재 영상을 물어가는 사고 방지)
  if (!blobs.length) return res.status(404).json({ error: 'not found' });

  const items = blobs.map(b => {
    const parts = b.pathname.replace(/^clips\//, '').split('.');
    const ext = parts[parts.length - 1].toLowerCase();
    const slot = parts.length > 2 ? parts[1].toLowerCase() : '';
    const base = KIND[ext] || 'video';
    return { url: b.url, kind: (base === 'video' && slot.includes('green')) ? 'chroma' : base };
  }).sort((a, b) => (ORDER[a.kind] - ORDER[b.kind]) || a.url.localeCompare(b.url));

  // items = 전체 목록 / url·kind = 첫 항목 (이전 응답 형태 호환)
  return res.status(200).json({ items, url: items[0].url, kind: items[0].kind });
}
