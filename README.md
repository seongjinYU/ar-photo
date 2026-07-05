# 기도하는 예수님 · 마커 AR (WebAR 굿즈)

굿즈 카드의 **마커 그림**을 폰 카메라로 비추면, 앱 설치 없이 웹에서
**3D 예수님 캐릭터가 그림 위에 얹혀서 등장**하는 WebAR 페이지입니다.

MindAR(이미지 트래킹) + three.js 기반, 단일 정적 HTML 한 장.

> **참고**: 초기 설계는 마커리스 `<model-viewer>` 방식이었으나,
> "그림(마커)에 캐릭터가 얹히는" 경험을 위해 **MindAR 마커 트래킹 방식으로 전환**했습니다.
> (설계 문서: `docs/superpowers/specs/2026-07-04-webar-goods-design.md`)

## 파일 구성

```
webar-goods/
├── index.html            # 핵심 페이지 (MindAR + three.js, iOS 카메라 대응)
├── assets/
│   ├── model-opt.glb     # 3D 모델 (Draco 압축본, 실제 사용 · 1MB)
│   ├── model.glb         # 3D 모델 원본 (소스 · 18MB, 압축 전)
│   ├── target.mind       # marker.png를 MindAR로 컴파일한 인식 데이터
│   └── marker.png        # 인쇄/표시용 마커 그림 (이걸 카메라로 비춤)
├── qr.png                # 배포 URL QR 코드
├── docs/                 # 설계 문서
└── README.md
```

## 작동 방식

```
[QR 스캔] → [index.html 열림(HTTPS)] → [카메라 권한 허용]
   → [카메라로 marker.png(그림)를 비춤]
   → [target.mind로 그림 인식] → [그림 위에 3D 예수님 등장 🙏]
```

- 서버 로직 없음(정적). 브라우저가 파일을 받아 three.js로 렌더링.
- three.js·MindAR는 jsdelivr CDN에서 로드 (빌드 불필요).
- **iOS 대응**: MindAR 기본 렌더 대신 카메라 영상을 3D 캔버스 배경 텍스처로 직접 그려
  아이폰 Safari의 검은 화면 문제를 우회합니다 (`index.html` 렌더 루프 참고).

## 마커 준비

`assets/marker.png` 를 **카드에 인쇄하거나 화면에 띄워** 사용합니다.
카메라로 이 그림을 비추면 그 위에 캐릭터가 나타납니다.

## URL 파라미터 (캐릭터 위치/크기 조정)

배치가 어긋나면 URL 쿼리로 실시간 조정할 수 있습니다.

| 파라미터 | 의미 | 기본값 |
|---|---|---|
| `s` | 크기(scale) | 0.5 |
| `rx` `ry` `rz` | 회전(도 단위) | 0 |
| `x` `y` `z` | 위치 | 0 |
| `debug` | `1`이면 하단 로그 표시 | 꺼짐 |

예: `index.html?s=0.4&rx=90&y=0.1&debug=1`

## 로컬에서 확인하기

```bash
cd webar-goods
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

> 카메라/AR은 **HTTPS 주소**에서만 동작합니다.
> 로컬(HTTP)에서는 코드 로드까지만 확인되고, 실제 카메라 테스트는 배포 후 폰에서 하세요.

## 배포하기 (HTTPS 필수)

정적 파일이라 무료 HTTPS 호스팅이면 됩니다. 이 프로젝트는 **Vercel**에 연결되어 있습니다.

```bash
cd webar-goods
vercel        # 안내 따라가면 https URL 발급 (root URL이 index.html = 마커 AR)
```

## QR 코드 생성

배포 URL(root)이 확정되면 그 주소로 QR을 만들어 카드에 인쇄합니다.

```bash
# 예: qrencode 사용 (brew install qrencode)
qrencode -o qr.png -s 10 "https://내-배포-주소.vercel.app"
```

## 3D 모델 교체

1. 새 모델을 `assets/model.glb`(원본)로 저장.
2. Draco 압축본 `assets/model-opt.glb` 생성 (예: `gltf-transform draco model.glb model-opt.glb`).
   - 모바일 로딩을 위해 **2~3MB 이하** 권장 (텍스처 1024px 이하).
3. `index.html`은 `./assets/model-opt.glb`를 로드하므로, 파일명을 유지하면 코드 수정 불필요.

## 마커 교체

`assets/marker.png`를 바꾸면 `assets/target.mind`도 다시 컴파일해야 합니다.
MindAR 이미지 타겟 컴파일러(<https://hiukim.github.io/mind-ar-js-doc/tools/compile>)에
새 그림을 올려 `.mind` 파일을 받아 교체하세요.

## 지원 환경

- 안드로이드 Chrome / 아이폰 Safari (HTTPS + 카메라 권한 허용).
- 카메라 권한 거부 시 안내 화면 + 다시 시도 버튼 제공.
