# Google AI (Antigravity) 작업 내역

본 문서는 Google AI 에이전트가 `SlideCast (SlideNarrator)` 프로젝트의 MVP 개발을 진행하며 새롭게 작성하거나 수정한 내역을 기록하는 공간입니다.

---

## 🚀 [Phase 1] 프로젝트 기반 구축 (MVP 기초)
> **완료 상태**: 완료

초기 코어 로직 개발을 위해 프로젝트의 뼈대와 인프라 구성을 완료했습니다.

* **`requirements.txt`**: FastAPI, Celery, Redis, python-pptx, edge-tts, ffmpeg-python 등 프로젝트에서 사용할 필수 라이브러리 목록 작성
* **`.env.example`**: 데이터베이스, Redis, S3 연결 및 환경변수 템플릿 파일 생성
* **`docker-compose.yml`**: 로컬 백엔드 환경(PostgreSQL, Redis) 구성을 위한 도커 컴포즈 파일 생성
* **`src/main.py`**: FastAPI 진입점, CORS 미들웨어 및 기본 API(`/health`) 생성
* **`src/config.py`**: `pydantic-settings`를 이용한 환경변수 객체화 및 관리 로직 구성

---

## 🚀 [Phase 2] 핵심 처리 파이프라인 (PPTX -> MP4) 구축
> **완료 상태**: 완료

PPTX 파일을 분석하고 이미지/음성으로 변환한 뒤 MP4 영상으로 합성하는 코어 모듈을 구축했습니다.
* **`src/core/pptx_parser.py`**: `python-pptx`를 활용하여 슬라이드별 번호와 노트(대본)를 파싱하는 추출 로직 구현
* **`src/core/image_converter.py`**: `LibreOffice`(headless)와 `PyMuPDF`를 사용하여 PPTX를 PDF로, 그리고 PDF를 고해상도 PNG로 변환하는 파이프라인 구현
* **`src/core/tts_engine.py`**: `edge-tts`를 통해 텍스트(대본)를 성우 음성(MP3)으로 비동기 변환하는 기능 구현. (다국어/성별 목소리 매핑 포함)
* **`src/core/video_composer.py`**: `ffmpeg-python`을 이용하여 1920x1080(FHD) 사이즈로 패딩 및 리스케일링을 수행하고, 오디오 지연(딜레이) 설정과 함께 비디오 클립 생성 및 전체 슬라이드 병합(concat) 기능 구현

---

## 🚀 [Phase 3] 비동기 작업 시스템 및 DB (Celery + WS) 구축
> **완료 상태**: 완료

대용량 영상 변환 작업을 백그라운드에서 처리하고 진행 상태를 실시간으로 클라이언트에게 전달하는 체계를 구축했습니다.
* **`src/worker/celery_app.py`**: Redis를 브로커(Broker) 및 백엔드(Backend)로 사용하는 Celery 애플리케이션 초기화 및 워커 설정
* **`src/worker/tasks.py`**: `process_presentation` Celery 비동기 태스크 생성. Phase 2의 핵심 처리 파이프라인 4단계를 순차적으로 실행하며, 각 단계마다 상태(PROGRESS)를 업데이트하도록 로직 연동
* **`src/models/job.py`**: SQLAlchemy를 사용한 작업(Job) 테이블 정의 (진행률, 파일명, 상태 관리 등)
* **`src/models/slide.py`**: 슬라이드(Slide) 단위 테이블 정의 (개별 대본 원본/수정본 보관 및 슬라이드별 진행 관리)
* **`src/api/websocket.py`**: FastAPI WebSocket을 활용한 실시간 진행 상황 브로드캐스팅(`ConnectionManager`) 모듈 구현

---

## 🚀 [Phase 4] 웹 인터페이스 (MVP 완성)
> **완료 상태**: 완료

사용자가 브라우저에서 직접 PPTX를 업로드하고 진행 상황을 확인하며 결과 영상을 다운로드할 수 있는 웹 페이지와 API 엔드포인트를 완성했습니다.
* **`src/api/routes/upload.py`**: PPTX 파일 업로드 및 Celery 비동기 작업(`process_presentation`) 스케줄링 API (`POST /api/upload`)
* **`src/api/routes/jobs.py`**: 진행 상태를 폴링(Polling) 방식으로 조회할 수 있는 대체(fallback) API (`GET /api/jobs/{job_id}`)
* **`src/static/index.html` & `style.css`**: 현대적인 UI/UX(Glassmorphism 느낌의 어두운 테마)를 적용한 파일 드래그 앤 드롭 업로드 페이지
* **`src/static/app.js`**: `fetch` API를 이용한 파일 업로드 및 WebSocket 기반의 실시간 프로그레스 바(Progress Bar) 업데이트 로직 구현
* **`src/main.py` 업데이트**: 위에서 작성한 모든 라우터(Upload, Jobs, WebSocket) 및 정적 파일(`StaticFiles`) 마운트 연동 완료

---

## 🚀 [Phase 5] 품질 개선 및 Legacy 코드 통합 (UI 설정, SRT 추가, 안정화)
> **완료 상태**: 완료

기존 사용자 로컬에서 사용하던 `ref/` 폴더 내의 스크립트 로직(subprocess 기반 ffmpeg 통제)을 통합하고, UI에서 설정값을 직접 선택할 수 있도록 개선했습니다.
* **Legacy FFMPEG 로직 통합 (`video_composer.py`)**: `ffmpeg-python` 라이브러리의 복잡한 필터 체인 대신, 기존 `ref/generate_video.py`에서 검증된 `subprocess` 기반의 Raw CLI 명령어로 원복하여 렌더링 안정성 확보
* **자막 자동 생성 (`subtitle_maker.py`)**: 추출된 슬라이드 대본과 TTS 오디오 길이를 계산하여, YouTube 업로드 시 바로 사용할 수 있는 `.srt` 포맷의 자막 파일을 자동 생성하는 파이프라인 추가 (`tasks.py`에 연동 완료)
* **API 옵션 확장 (`upload.py`, `tasks.py`)**: PPTX 업로드 시 목소리 종류(`voice_key`)와 화면 전환 여백 시간(`delay_sec`)을 매개변수로 받아 동적으로 생성하도록 업그레이드
* **UI/UX 설정 기능 추가 (`index.html`, `style.css`, `app.js`)**: 사용자가 업로드 전 한국어/영어 등 다양한 목소리와 딜레이 타임을 폼 형태로 직접 선택할 수 있는 환경 설정 UI 컨트롤 추가

---
