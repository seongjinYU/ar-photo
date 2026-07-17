// token → 영상 URL 조회 (파일명 = 매핑이라 목록에서 찾기만 하면 됨)
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  const t = String(req.query.t || '').toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(t)) return res.status(400).json({ error: 'bad token' });
  const { blobs } = await list({ prefix: `clips/${t}.mp4`, limit: 1 });
  res.setHeader('cache-control', 'no-store');       // 재촬영 즉시 반영
  if (!blobs.length) return res.status(404).json({ error: 'not found' });
  return res.status(200).json({ url: blobs[0].url });
}
