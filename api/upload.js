// 부스 업로드 토큰 발급: 브라우저가 Blob 저장소로 직접 업로드하게 허가
// (파일이 함수를 거치지 않아 용량 제한(4.5MB)을 피함)
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // clips/<token>.mp4 형식만 허용 (token: 영문소문자/숫자/하이픈 3~24자)
        if (!/^clips\/[a-z0-9-]{3,24}\.mp4$/.test(pathname)) {
          throw new Error('잘못된 경로: ' + pathname);
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime'],
          addRandomSuffix: false,
          allowOverwrite: true,            // 같은 token 재업로드(재촬영) 허용
          maximumSizeInBytes: 80 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},   // 파일명=token이 곧 매핑이라 별도 기록 불필요
    });
    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: String(e.message || e) });
  }
}
