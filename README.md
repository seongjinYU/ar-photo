# 기도하는 예수님 · WebAR 굿즈

QR을 폰으로 스캔하면 앱 설치 없이 웹에서 **3D 예수님 캐릭터가 바로 등장**하고,
'실제 공간에서 보기'를 누르면 **바닥·책상 위에 놓아볼 수 있는** WebAR 페이지입니다.

- **기본 방식(현재)**: 구글 `<model-viewer>` — **마커리스 네이티브 AR** (iPhone Quick Look / Android Scene Viewer).
  떨림 없이 안정적이고, 무료·자체 호스팅. → `index.html`
- **대안(보존용)**: MindAR 이미지 트래킹 — 인쇄한 **그림(마커) 위에** 캐릭터가 얹히는 방식. → `marker-ar.html`
  (폰에서 두 방식을 비교해보려고 남겨둠. 마커리스로 확정되면 삭제 가능)

## 두 방식 비교

| | `index.html` (마커리스 · 기본) | `marker-ar.html` (마커 · 대안) |
|---|---|---|
| 경험 | QR→3D 즉시, 버튼 눌러 공간에 배치 | 그림에 카메라를 비추면 그림 위에 등장 |
| 트래킹 | OS 네이티브(ARKit/ARCore) — 떨림 없음 | MindAR — 다소 흔들림 |
| 준비물 | 없음 | 인쇄한 마커 그림 필요 |
| 기술 | model-viewer (CDN) | MindAR + three.js (CDN) |

## 파일 구성

```
webar-goods/
├── index.html            # 기본: 마커리스 네이티브 AR (model-viewer)
├── marker-ar.html        # 대안: 마커 AR (MindAR + three.js)
├── assets/
│   ├── model-opt.glb     # 3D 모델 (Draco 압축본, 실사용 · 1MB)
│   ├── model.glb         # 3D 모델 원본 (소스 · 18MB)
│   ├── target.mind       # (marker-ar 전용) 마커 인식 데이터
│   └── marker.png        # (marker-ar 전용) 인쇄용 마커 그림
├── qr.png                # 배포 URL QR 코드
├── docs/                 # 설계 문서
└── README.md
```

## 작동 방식 (기본 `index.html`)

```
[QR 스캔] → [index.html 열림(HTTPS)]
   → model-viewer가 model-opt.glb를 화면에 3D로 렌더 (자동 회전, 손가락 조작)
   → '실제 공간에서 보기' 버튼
        ├ iPhone  → Quick Look  (GLB→USDZ 자동 변환)
        └ Android → Scene Viewer (GLB로 바닥에 배치)
```

- 서버 로직 없음(정적). model-viewer는 jsdelivr CDN에서 로드(빌드 불필요), Draco는 자동 디코딩.
- AR 미지원 기기(데스크톱 등)에서는 AR 버튼이 자동으로 숨겨지고 화면 속 3D만 제공.

## 로컬에서 확인하기

```bash
cd webar-goods
python3 -m http.server 8080
# http://localhost:8080 접속 → 화면 속 3D 렌더까지 확인
```

> 실제 공간 AR과 카메라는 **HTTPS 주소에서만** 동작합니다.
> 로컬(HTTP)에선 3D 렌더까지만 확인되고, AR은 배포 후 실제 폰에서 테스트하세요.

## 배포 & 폰 테스트 (HTTPS 필수)

이 프로젝트는 **Vercel**에 연결되어 있습니다.

```bash
cd webar-goods
vercel        # https URL 발급 → 폰 카메라로 QR/URL 열기
```

- 안드로이드: 페이지 → '실제 공간에서 보기' → Scene Viewer로 바닥에 배치.
- 아이폰(Safari): 동일 흐름 → Quick Look으로 배치.
- 비교하려면 폰에서 `.../marker-ar.html`도 함께 열어보세요.

## 3D 모델 교체

1. 새 모델을 `assets/model.glb`(원본)로 저장.
2. Draco 압축본 `assets/model-opt.glb` 생성 (예: `gltf-transform draco model.glb model-opt.glb`).
   - 모바일 로딩을 위해 **2~3MB 이하** 권장 (텍스처 1024px 이하).
3. `index.html`은 `./assets/model-opt.glb`를 로드하므로 파일명을 유지하면 코드 수정 불필요.

## (선택) 아이폰 AR 품질 높이기

Quick Look은 GLB에서 USDZ를 자동 생성하지만, 더 정확한 품질을 원하면 수제 USDZ를 쓰세요.

1. Mac 무료 앱 **Reality Converter**(Apple)로 `model.glb` → `model.usdz` 변환.
2. `assets/model.usdz`로 저장.
3. `index.html`의 `<model-viewer>`에 `ios-src="./assets/model.usdz"` 속성 추가.

## 지원 환경

- **화면 속 3D**: 모든 최신 브라우저 (데스크톱/모바일).
- **실제 공간 AR**: 안드로이드 Chrome(Scene Viewer), 아이폰 Safari(Quick Look).
