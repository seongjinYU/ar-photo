# WebAR QR 굿즈 — 설계서 (프로토타입)

- **작성일**: 2026-07-04
- **상태**: 프로토타입 구현 완료 — **단, 아래 3장의 기술 선택에서 방향 전환됨** (구현 메모 참고)
- **목표 범위**: AR 웹페이지 1개 (프로토타입). 재사용 템플릿·카탈로그는 이후 단계.

> **구현 메모 (2026-07-05 정리)**
> 본 설계서는 마커리스 `<model-viewer>` 방식으로 확정했으나, 실제 구현은
> "그림(마커) 위에 캐릭터가 얹히는" 경험을 위해 **MindAR 이미지 트래킹 방식으로 전환**했습니다.
> 최종 구현본은 `index.html` (MindAR + three.js, iOS 카메라 대응).
> 따라서 아래 3~7장의 `model-viewer` 관련 서술은 **초기 설계 기록**이며 현재 코드와 다릅니다.
> 실제 작동 방식은 프로젝트 루트 `README.md`를 참고하세요.

## 1. 개요

QR 코드를 폰 카메라로 스캔하면 별도 앱 설치 없이 웹 브라우저에서 3D 캐릭터/물건이
바로 보이고, 원하면 실제 공간(바닥·책상)에 놓아볼 수 있는 WebAR 굿즈 페이지.

원래 검토했던 이미지 트래킹(마커 카드) 방식 대신, **QR 스캔 → 즉시 등장** 경험을 위해
구글 `<model-viewer>` 기반의 마커리스 방식으로 확정.

## 2. 사용자 시나리오

1. 사용자가 폰 기본 카메라로 굿즈 카드의 QR 코드를 스캔한다.
2. QR에 매핑된 HTTPS 웹페이지가 열린다.
3. 페이지에 3D 캐릭터가 **바로 표시**된다 (자동 회전, 손가락으로 회전·확대·이동).
4. (선택) 'AR로 보기' 버튼을 누르면 캐릭터가 실제 공간에 놓인 것처럼 카메라 화면에 합성된다.
   - 안드로이드: Scene Viewer (`.glb` 사용)
   - 아이폰: Quick Look (`.usdz` 사용)

## 3. 기술 선택 (확정)

| 구분 | 선택 | 이유 |
|---|---|---|
| 핵심 기술 | 구글 `<model-viewer>` 웹 컴포넌트 | 화면 속 3D + 실제공간 AR을 한 번에 처리, 빌드 불필요 |
| 3D 포맷 | GLTF/GLB (화면 3D·안드로이드 AR), USDZ (아이폰 AR) | 웹 표준 + 애플 AR 표준 |
| 구성 | 단일 정적 HTML 페이지 | 마커/.mind 컴파일·프레임워크 빌드 불필요, 최대 단순·안정 |
| 호스팅 | HTTPS 정적 호스팅 (Vercel/Netlify/GitHub Pages) | WebAR은 HTTPS 필수. 배포처는 로컬 검증 후 결정 |

**채택하지 않은 대안**
- MindAR 이미지 트래킹: 마커 카드 필요 + 2단계 경험이라 "QR만 찍으면 바로" 목표에 부적합.
- Three.js + WebXR 직접 구현: iOS Safari WebXR 미지원, 작업량 과다.

## 4. 아키텍처

```
[굿즈 카드의 QR] --스캔--> [HTTPS 정적 웹페이지 (index.html)]
                              │
                              ├─ <model-viewer> 로 캐릭터 3D 즉시 렌더 (auto-rotate, camera-controls)
                              └─ 'AR로 보기' 버튼 (ar, ar-modes="scene-viewer quick-look webxr")
                                   ├ 안드로이드 → Scene Viewer  (assets/model.glb)
                                   └ 아이폰    → Quick Look    (assets/model.usdz)
```

정적 파일만으로 구성 — 서버 로직 없음. 브라우저가 파일을 받아 렌더링.

## 5. 폴더 구조

```
webar-goods/
├── index.html              # model-viewer 페이지 (핵심)
├── assets/
│   ├── model.glb           # 사용자가 제공하는 3D 모델 (필수 입력)
│   └── model.usdz          # GLB에서 변환한 아이폰 AR용 (구현 중 생성)
├── qr.png                  # 배포 URL을 담은 QR 코드 (배포 후 생성)
├── docs/superpowers/specs/ # 설계·계획 문서
└── README.md               # 로컬 실행·배포·QR 재생성 방법
```

## 6. 컴포넌트 (단일 페이지 구성요소)

| 요소 | 역할 | 의존성 |
|---|---|---|
| `<model-viewer>` | 3D 렌더링, 카메라 컨트롤, AR 진입 | model-viewer JS (CDN 또는 self-host), model.glb/usdz |
| 로딩 표시(poster/progress) | 모델 다운로드 동안 스피너/포스터 노출 | model-viewer 내장 슬롯 |
| 'AR로 보기' 버튼 | 실제 공간 배치 트리거, OS별 자동 분기 | model-viewer `ar` 속성 |
| 안내 문구 | 카메라 권한·조작법 간단 안내, AR 미지원 폴백 안내 | 없음 |

각 요소는 index.html 내에서 명확히 분리된 역할을 가진다.

## 7. 데이터 흐름 / 상태

- 상태 관리 없음(정적). model-viewer 내부 로드 상태(로딩/로드완료/에러)만 UI에 반영.
- 입력: `assets/model.glb`(+`model.usdz`). 출력: 렌더된 3D / AR 세션.

## 8. 에러·예외 처리

- **카메라/AR 미지원 기기**: AR 버튼 자동 숨김 + "이 기기는 화면 속 3D만 지원" 안내.
- **모델 로드 실패**: 대체 메시지 + 재시도 안내.
- **아이폰인데 usdz 없음**: AR 버튼이 동작 안 하므로 usdz 필수 준비 (본 설계 범위에 포함).
- **HTTP(비보안) 접속**: WebXR/카메라 미동작 → HTTPS 배포 필수임을 README에 명시.

## 9. 구현 시 확인/결정할 항목 (구현 단계에서 처리)

1. **3D 모델 파일 제공**: 사용자가 `assets/model.glb`에 실제 파일 배치.
2. **USDZ 변환 방법 결정** (도구 미설치 상태):
   - Apple Reality Converter(무료 Mac GUI) / `usdzconvert`(usdpython) / node 변환 라이브러리 중 택1.
   - 구현 시 설치 가능 여부 확인 후 진행.
3. **model-viewer 로드 방식**: CDN(`type=module`) vs self-host(오프라인·안정성). 우선 CDN, 필요 시 self-host.
4. **호스팅 배포처**: 로컬 검증 후 Vercel/Netlify/GitHub Pages 중 결정.
5. **QR 생성**: 배포 URL 확정 후 `qr.png` 생성.

## 10. 검증 방법

- 데스크톱 크롬: 로컬 서버로 열어 3D 뷰어 표시·자동회전·마우스 회전 확인.
- 실제 폰(안드로이드): QR/URL → 페이지 → 3D 등장 → AR 버튼 → Scene Viewer 배치 확인.
- 실제 폰(아이폰): 동일 흐름 → Quick Look 배치 확인 (usdz 준비 후).

## 11. 범위 밖 (이번 단계 아님)

- 여러 캐릭터 카탈로그 / 마커별 분기.
- 어떤 .glb든 자동 처리하는 재사용 템플릿·CMS.
- 애니메이션 트리거(탭하면 동작 등) 고급 인터랙션 — 기본 auto-rotate만.
- 굿즈 카드 그래픽 디자인.
