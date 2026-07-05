# WebAR QR 굿즈

QR 코드를 폰 카메라로 스캔하면, 앱 설치 없이 웹에서 **3D 캐릭터가 바로 등장**하고
원하면 **실제 공간(바닥·책상)에 놓아볼 수 있는** WebAR 페이지입니다.
구글 `<model-viewer>` 기반, 마커 없음, 정적 HTML 한 장.

## 파일 구성

```
webar-goods/
├── index.html          # 핵심 페이지 (model-viewer)
├── assets/
│   └── model.glb       # 3D 모델 (교체 가능)
├── qr.png              # 배포 URL QR 코드 (배포 후 생성)
└── README.md
```

## 1. 로컬에서 확인하기

3D 뷰어는 `http://localhost` 에서 잘 동작합니다.

```bash
cd webar-goods
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

> 참고: 폰의 **AR(실제 공간 배치)** 및 카메라 기능은 **HTTPS 주소**에서만 동작합니다.
> 로컬에서는 화면 속 3D 렌더링까지 확인하고, AR은 배포 후 실제 폰에서 테스트하세요.

## 2. 배포하기 (HTTPS 필수)

정적 파일이라 무료 HTTPS 호스팅 아무거나 가능합니다.

**Vercel (가장 간단)**
```bash
npm i -g vercel
cd webar-goods
vercel        # 안내 따라가면 https URL 발급
```

**Netlify** — https://app.netlify.com 에서 `webar-goods` 폴더를 드래그&드롭.

**GitHub Pages** — 레포에 올리고 Settings → Pages 에서 브랜치 지정.

## 3. QR 코드 생성

배포 URL이 확정되면 그 주소로 QR을 만들어 카드에 인쇄합니다.

```bash
# 예: qrencode 사용 (brew install qrencode)
qrencode -o qr.png -s 10 "https://내-배포-주소.vercel.app"
```
또는 온라인 QR 생성기에 URL을 넣어 이미지를 받습니다.

## 4. 3D 모델 교체

`assets/model.glb` 를 새 `.glb` 파일로 바꾸면 됩니다.
파일명이 다르면 `index.html` 의 `src="./assets/model.glb"` 도 함께 수정하세요.

- 권장: 모바일 로딩을 위해 **2~3MB 이하**로 최적화 (텍스처 1024px 이하).
- 큰 파일은 첫 로딩이 느립니다. `gltf-transform` 등으로 Draco/meshopt 압축을 권장.

## 5. 아이폰 AR 품질 높이기 (선택)

아이폰의 실제공간 AR(Quick Look)은 `model-viewer`가 **USDZ를 자동 생성**해 동작합니다.
별도 파일 없이도 되지만, 더 정확한 품질을 원하면 수제 USDZ를 추가하세요.

1. 무료 Mac 앱 **Reality Converter**(Apple)로 `model.glb` → `model.usdz` 변환.
2. 변환한 파일을 `assets/model.usdz` 로 저장.
3. `index.html` 의 `<model-viewer>` 에 `ios-src="./assets/model.usdz"` 속성 추가.

## 지원 환경

- **화면 속 3D**: 모든 최신 브라우저 (데스크톱/모바일).
- **실제공간 AR**: 안드로이드 Chrome(Scene Viewer), 아이폰 Safari(Quick Look).
- AR 미지원 기기에서는 AR 버튼이 자동으로 숨겨지고 화면 속 3D만 제공됩니다.
