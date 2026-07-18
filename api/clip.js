// token → 미디어 목록 조회 (파일명 = 매핑이라 목록에서 찾기만 하면 됨)
// 한 카드(token)에 여러 장을 붙여두면 뷰어에서 페이지로 넘겨본다.
//
//   clips/<token>.<ext>            → 사진(png·jpg) / 영상(mp4·mov)
//   clips/<token>.<slot>.<ext>     → 같은 종류를 여러 개 넣을 때. slot에 'green'이 들어가면
//                                    그린스크린 누끼 클립으로 취급(액자 없이 피사체만 세움)
import { list, copy } from '@vercel/blob';
import { readCurrent } from '../lib/current.js';

const KIND = { mp4: 'video', mov: 'video', png: 'image', jpg: 'image', jpeg: 'image' };
const ORDER = { image: 0, video: 1, chroma: 2 };   // 사진 → 영상 → 누끼 순으로 페이지

export default async function handler(req, res) {
  const t = String(req.query.t || '').toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(t)) return res.status(400).json({ error: 'bad token' });

  const { blobs } = await list({ prefix: `clips/${t}.`, limit: 20 });
  res.setHeader('cache-control', 'no-store');      // 재촬영 즉시 반영
  if (!blobs.length) {
    // 이 카드에 아직 영상이 없다 → 부스가 방금 올린 "현재 팀 영상"이 열려 있으면
    // 지금 이 카드에 복사해 영구 고정한다(= 첫 스캔 바인딩).
    const claimed = await claimCurrent(t);
    if (!claimed) return res.status(404).json({ error: 'not found' });
    return res.status(200).json({ items: [claimed], url: claimed.url, kind: claimed.kind });
  }

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

// 카드 첫 스캔: 부스가 방금 올린 "현재 영상"을 이 카드로 복사해 영구 고정한다.
// (원본은 videos/에 그대로 두고 복사만 하므로, 여러 명이 각자 카드로 스캔해도 모두 같은 영상을 가져간다.)
async function claimCurrent(t) {
  const cur = await readCurrent();
  if (!cur || !cur.open || !cur.videoUrl) return null;
  const dest = `clips/${t}.mp4`;
  try {
    const b = await copy(cur.videoUrl, dest, { access: 'public', addRandomSuffix: false });
    return { url: b.url, kind: 'video' };
  } catch (e) {
    // 거의 동시에 이미 복사됐을 수도 있으니 한 번 더 확인
    const { blobs } = await list({ prefix: dest, limit: 1 });
    return blobs.length ? { url: blobs[0].url, kind: 'video' } : null;
  }
}
