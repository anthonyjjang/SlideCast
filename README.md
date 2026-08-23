# SlideNarrator — PPTX AI 자동 나레이션 영상 변환 SaaS

> **PPTX 파일(발표 자료) 하나로 AI 음성 나레이션이 포함된 고화질 발표 영상을 자동 생성하는 서비스입니다.**

---

## 🤖 The AI Collaboration Project

이 프로젝트는 최신 AI 에이전트들의 완벽한 협업으로 탄생했습니다.

* **기획 & 아키텍처 설계**: `Anthropic Claude` (요구사항 정의, 비즈니스 모델 기획, GSD 로드맵 작성)
* **실제 개발 & 트러블슈팅**: `Google DeepMind Gemini (Antigravity)` (FastAPI 백엔드, 비동기 파이프라인, 프론트엔드 UI, 멀티미디어 렌더링 전 과정 구현)

---

## ✨ 주요 기능 (현재 구현 완료된 MVP 기능)

현재 아래의 기능들이 모두 로컬 환경에서 완벽하게 동작합니다.

* **발표 스크립트 자동 추출**: PPTX의 "슬라이드 노트"를 읽어 대본으로 자동 인식
* **다국어 AI 음성 생성 (TTS)**: Microsoft Edge-TTS 엔진을 활용한 고품질 음성 생성
* **커스텀 설정 UI**: 
  * 한국어, 영어 등 다양한 목소리 톤 및 성별 선택 기능
  * 화면 전환 시 자연스러운 여백을 위한 "딜레이 타임(초)" 설정 기능
* **오디오/비디오 자동 씽크 및 병합 (FFMPEG)**: 각 슬라이드 오디오 길이에 맞춰 무음 패딩(`apad`)을 적용하여 씽크 어긋남 없이 완벽하게 병합된 MP4 영상 제공
* **YouTube용 자막(.srt) 자동 생성**: 생성된 각 슬라이드별 오디오 타임스탬프를 계산하여 유튜브 업로드 시 바로 쓸 수 있는 SRT 자막 파일 생성
* **고품질 폰트 렌더링**: Mac 환경의 `Apple Keynote` 애플스크립트를 원격 제어하여 한글 폰트(맑은 고딕 등) 깨짐 없이 원본 그대로 PDF/PNG 변환 (Linux 서버 배포 시 LibreOffice 자동 Fallback 지원)
* **실시간 진행률 표시**: Celery & Redis & WebSocket을 활용해 브라우저에서 작업 진행 상황 실시간 확인 및 최종 영상 다운로드

---

## 📖 퀵 가이드 (작업자용)

발표자료 작성법부터 실행 방법까지 한 번에 정리한 가이드 덱입니다.

| 항목 | 위치 |
|------|------|
| 가이드 발표자료 (14장) | [`docs/guide/SlideCast_퀵가이드.pptx`](docs/guide/SlideCast_퀵가이드.pptx) |
| 가이드 생성 스크립트 | [`scripts/make_guide_deck.py`](scripts/make_guide_deck.py) |
| 나레이션 영상 (6분 36초) | `output/guide/final_guide.mp4` — 아래 명령으로 생성 |

이 가이드 영상은 **가이드 PPTX 자체를 SlideCast에 넣어** 만든 것입니다. 직접 재생성하려면:

```bash
python scripts/make_guide_deck.py docs/guide/SlideCast_퀵가이드.pptx
# 웹 UI(http://localhost:8000)에 위 파일을 업로드하면 영상이 생성됩니다
```

### 발표자료 작성 시 꼭 지킬 것

1. **노트 첫 줄은 읽히지 않습니다.** 첫 줄은 키메시지 자리이고, 실제 대본은 **2번째 줄부터** 적습니다.
   한 줄만 적으면 그 슬라이드는 무음으로 지나갑니다.
2. **숨긴 슬라이드는 영상과 대본에서 함께 제외됩니다.** 안 쓰는 장은 삭제 대신 숨기기를 권장합니다.
3. **파일 100MB / 슬라이드 100장** 이내여야 합니다. 초과 시 업로드 단계에서 거부됩니다.
4. **애니메이션·화면 전환 효과는 반영되지 않습니다.** 각 슬라이드의 최종 상태만 캡처됩니다.
5. **16:9 비율**로 작성하세요. 다른 비율은 레터박스가 생깁니다.
6. 문장은 **2~4개 단위로 짧게** 끊으세요. TTS는 마침표를 기준으로 호흡을 나눕니다.


---

## 🚀 로컬 실행 가이드 (How to run)

현재 로컬(Mac 환경 기준)에서 MVP 버전을 완벽하게 구동하기 위한 순서입니다.

### 1. 사전 요구사항 (Prerequisites)
시스템에 아래 패키지가 설치되어 있어야 합니다. (Mac Homebrew 기준)
```bash
brew install ffmpeg redis libreoffice
```
*(Mac 환경에서는 LibreOffice 대신 기본 설치된 Keynote를 우선적으로 사용하여 고품질로 렌더링합니다.)*

### 2. 파이썬 가상환경 및 패키지 설치
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 백그라운드 서비스(Redis) 실행
Celery 메시지 브로커를 위해 Redis 서버가 켜져 있어야 합니다. (새 터미널 창)
```bash
redis-server
```
*(Docker가 있다면 `docker-compose up -d redis` 로도 실행 가능합니다.)*

### 4. Celery 워커(Worker) 실행
영상 합성 및 TTS 생성을 백그라운드에서 전담할 워커를 실행합니다. (새 터미널 창, 가상환경 활성화 필수)
```bash
celery -A src.worker.celery_app worker --loglevel=info
```

### 5. FastAPI 웹 서버 실행
사용자가 접속할 웹 서버를 실행합니다. (새 터미널 창, 가상환경 활성화 필수)
```bash
uvicorn src.main:app --reload
```

### 6. 접속 및 테스트
브라우저를 열고 `http://localhost:8000` 에 접속하여 PPTX 파일을 업로드해 보세요!

---

## 🛠 기술 스택 (Tech Stack)

* **Backend**: Python 3.11+, FastAPI
* **Async Task**: Celery, Redis
* **Frontend**: HTML5, Vanilla JS, Tailwind CSS (예정)
* **Media Processing**: FFmpeg (영상 합성), Edge-TTS (음성 생성)
* **Document Parsing**: python-pptx (대본 추출), AppleScript/PyMuPDF (슬라이드 렌더링)

---

## 📚 문서 목록 (Docs)

기획 단계에서 Claude가 작성한 상세 문서들입니다.

| 문서 | 설명 |
|------|------|
| [프로젝트 계획](docs/01_PROJECT_PLAN.md) | 목표, 마일스톤, 타임라인, 경쟁사 분석 |
| [기능 요구사항](docs/02_REQUIREMENTS.md) | FR/NFR, 사용자 스토리 |
| [기술 스펙](docs/03_TECH_SPEC.md) | 아키텍처, 라이브러리, DB 스키마 |
| [API 명세](docs/04_API_SPEC.md) | REST API 설계 |
| [테스트 케이스](docs/05_TEST_CASES.md) | 단위/통합/E2E 테스트 |
| [배포 가이드](docs/06_DEPLOYMENT.md) | Docker, 클라우드, 도메인 |
| [사업계획서](docs/07_BUSINESS_PLAN.md) | 시장 분석, 원가, 수익 모델, 다국어 전략 |
| [YouTube 연동](docs/08_YOUTUBE_INTEGRATION.md) | SRT 자막, 챕터, API 업로드 |
