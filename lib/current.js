// "현재 팀 영상" 포인터 — 방금 부스에서 올린 영상이 무엇이고, 지금 카드 바인딩을
// 받는 중(open)인지 기록한다. 카드를 처음 스캔하면 이 포인터가 가리키는 영상이
// 그 카드에 복사되어 영구 고정된다(= 바인딩). 무거운 DB 없이 파일 한 개로 관리.
import { list } from '@vercel/blob';

export const POINTER = 'state/current.json';

// 포인터 내용은 덮어쓰기(overwrite)로 계속 바뀌므로, 캐시를 우회해(ts) 항상 최신을 읽는다.
export async function readCurrent() {
  const { blobs } = await list({ prefix: POINTER, limit: 1 });
  if (!blobs.length) return null;
  try {
    const r = await fetch(blobs[0].url + '?ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
