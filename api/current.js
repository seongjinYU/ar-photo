// 부스가 "현재 팀 영상"을 등록/마감하는 엔드포인트.
//   POST { videoUrl, batchId }  → 이 영상으로 열기(open). 이제 카드 스캔하면 이게 담긴다.
//   POST { close: true }        → 스캔 마감. 다음 팀 촬영 전에 눌러 이전 팀 영상이 새는 걸 막는다.
//   GET                         → 현재 상태 조회(부스 화면 표시용)
import { put } from '@vercel/blob';
import { POINTER, readCurrent } from '../lib/current.js';

const VIDEO_RE = /^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/videos\/[a-z0-9-]+\.(mp4|mov)$/i;

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json((await readCurrent()) || { open: false });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let next;
    if (body.close) {
      const cur = await readCurrent();
      next = { ...(cur || {}), open: false };
    } else {
      if (!VIDEO_RE.test(body.videoUrl || '')) {
        return res.status(400).json({ error: 'bad videoUrl' });
      }
      next = { videoUrl: body.videoUrl, batchId: String(body.batchId || ''), open: true, at: Date.now() };
    }
    await put(POINTER, JSON.stringify(next), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return res.status(200).json({ ok: true, ...next });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
