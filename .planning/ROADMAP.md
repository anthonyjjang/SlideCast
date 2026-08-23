# Roadmap: SlideNarrator

## Overview

PPTX → AI 음성 영상 자동 생성 SaaS. Phase 1~4에서 로컬 실행 가능한 MVP를 완성하고,
Phase 5~8에서 품질 개선·상용화·YouTube 연동으로 확장한다.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: 프로젝트 기반 구축** — FastAPI 앱 뼈대, 의존성, Docker 환경 설정
- [ ] **Phase 2: 핵심 처리 파이프라인** — PPTX 파싱·이미지 변환·TTS·영상 합성 4개 모듈
- [ ] **Phase 3: 비동기 작업 시스템** — Celery + Redis + DB 모델 + Job API + WebSocket
- [ ] **Phase 4: 웹 인터페이스 (MVP 완성)** — 업로드 UI + 스크립트 편집 + 진행 표시 + MP4 다운로드
- [ ] **Phase 5: 품질 개선** — 목소리 선택 UI, SRT 자막, 딜레이 설정, 에러 핸들링
- [ ] **Phase 5.1: 치명 버그 수정 및 안정화 (긴급)** — 무음 슬라이드 병합 파손, 슬라이드-이미지 정렬 어긋남, 경로 탈출, 죽은 WebSocket
- [ ] **Phase 6: 회원 & 결제** — 이메일 로그인, 무료/유료 플랜, 토스페이먼츠 연동
- [ ] **Phase 7: 클라우드 배포** — Docker 최적화, AWS EC2/S3/CloudFront, 모니터링
- [ ] **Phase 8: YouTube 연동** — 다국어 SRT 자막, 챕터 자동생성, 썸네일, YouTube Data API 업로드

## Phase Details

### Phase 1: 프로젝트 기반 구축
**Goal**: 로컬에서 `uvicorn src.main:app --reload`로 서버가 뜨고, Docker Compose로 전체 스택이 올라오는 환경 완성
**Depends on**: Nothing (첫 번째 phase)
**Research**: Unlikely (표준 FastAPI 프로젝트 셋업)
**Plans**: TBD

Plans:
- [x] 01-01: FastAPI 앱 뼈대 + 디렉터리 구조 (`src/main.py`, `src/config.py`, `src/api/`)
- [x] 01-02: `requirements.txt`, `.env.example`, `docker-compose.yml` (API + Redis + PostgreSQL)
- [~] 01-03: DB 모델 + Alembic 마이그레이션 초기화 (`jobs`, `slides` 테이블)
  - ⚠️ 검토(2026-08-23): `src/models/job.py`, `slide.py`는 작성됐으나 **어디서도 import되지 않음**. `alembic/` 디렉터리 없음, DB 세션·연결 코드 없음. 작업 상태는 Celery 결과 백엔드(Redis)에만 존재

### Phase 2: 핵심 처리 파이프라인
**Goal**: `python pipeline.py sample.pptx` 한 줄로 PPTX → 슬라이드 이미지 → MP3 → MP4 변환이 완료되는 독립 실행 파이프라인
**Depends on**: Phase 1
**Research**: Unlikely (라이브러리 명세가 docs/03_TECH_SPEC.md에 확정됨)
**Plans**: TBD

Plans:
- [x] 02-01: `src/core/pptx_parser.py` — PPTX 슬라이드 노트·제목 추출
- [x] 02-02: `src/core/image_converter.py` — LibreOffice headless로 PPTX → PNG 변환
- [x] 02-03: `src/core/tts_engine.py` — edge-tts 음성 생성, 목소리 설정
- [x] 02-04: `src/core/video_composer.py` — ffmpeg로 PNG + MP3 → MP4 합성

### Phase 3: 비동기 작업 시스템
**Goal**: API로 PPTX를 업로드하면 Celery가 백그라운드 처리하고, WebSocket으로 실시간 진행률을 받을 수 있는 백엔드 완성
**Depends on**: Phase 2
**Research**: Likely (Celery + FastAPI WebSocket 연동 패턴 확인 필요)
**Research topics**: Celery + FastAPI 연동 방식 (shared_task vs app.task), Redis pub/sub으로 WebSocket 진행률 푸시 패턴, SQLAlchemy 2.0 async 세션 관리
**Plans**: TBD

Plans:
- [x] 03-01: `src/worker/celery_app.py` + `src/worker/tasks.py` — 파이프라인 비동기 실행
- [x] 03-02: `src/api/routes/upload.py` + `src/api/routes/jobs.py` — 업로드·작업 조회 API
- [~] 03-03: `src/api/websocket.py` — Redis pub/sub 기반 실시간 진행 상황 WebSocket
  - ⚠️ 검토(2026-08-23): `ConnectionManager`만 있고 **`send_progress()` 호출부가 없음**. Redis pub/sub 미구현. 워커는 별도 프로세스라 인메모리 dict 접근 불가 → 현재 진행률은 `app.js`의 2초 폴링으로만 동작
- [x] 03-04: `src/api/routes/download.py` — 완료 영상 다운로드 (로컬 파일 or S3 presigned URL)

### Phase 4: 웹 인터페이스 (MVP 완성)
**Goal**: 브라우저에서 PPTX를 업로드하고, 스크립트를 확인·편집하고, 진행률을 보면서 MP4를 다운로드할 수 있는 완전한 MVP
**Depends on**: Phase 3
**Research**: Unlikely (Vanilla JS + Dropzone.js, 내부 API 패턴 확립됨)
**Plans**: TBD

Plans:
- [x] 04-01: `src/static/index.html` + `style.css` — 업로드 UI (Dropzone.js 드래그앤드롭)
- [~] 04-02: `src/static/app.js` — 스크립트 편집 + 설정 선택 (목소리·딜레이·해상도) UI
  - ⚠️ 검토(2026-08-23): 목소리·딜레이 선택만 구현. **스크립트 편집 UI·해상도 선택 없음** (업로드 즉시 처리)
- [x] 04-03: `src/static/app.js` — WebSocket 진행 표시 + 완료 화면 + 다운로드 버튼

### Phase 5: 품질 및 성능 개선 (최적화)
**Goal**: 목소리 샘플 미리 듣기, 자막/에러 처리 외에도 생성 속도를 대폭 높이고 디스크 낭비를 막는 성능 개선
**Depends on**: Phase 4
**Research**: Unlikely (내부 모듈 확장 및 Python 비동기/멀티프로세싱)
**Plans**: TBD

Plans:
- [ ] 05-01: `src/api/routes/voices.py` — 목소리 목록 + 딜레이 설정 UI 연동
  - ⚠️ 검토(2026-08-23): **파일 자체가 존재하지 않음**. 목소리 4종이 `index.html`에 하드코딩 (`tts_engine.VOICES`의 6종과 불일치)
- [x] 05-02: `src/core/subtitle_maker.py` — 슬라이드 타임스탬프 기반 SRT 자막 생성
- [x] 05-03: 에러 핸들링 강화 — Celery 워커 에러 캐치 및 UI 알림 (완료)
- [ ] 05-04: **실행 속도 병렬화 최적화** — TTS 음성 생성 비동기 동시 요청(`asyncio`) 및 FFMPEG 영상 병합 멀티프로세싱 처리
- [ ] 05-05: **디스크 용량 최적화 (Garbage Collection)** — 영상 생성 완료 후 `/tmp/slidenarrator_uploads/{job_id}` 내의 임시 파일(이미지, PDF, 개별 오디오 클립) 자동 삭제 (최종 영상/자막만 보존)

### Phase 5.1: 치명 버그 수정 및 안정화 (긴급)
**Goal**: 어떤 PPTX를 넣어도 결과물이 조용히 망가지지 않는 상태 — 무음 슬라이드가 섞여도 오디오가 살아있고, 대본과 슬라이드 이미지가 항상 1:1로 정렬되며, 업로드 경로가 안전한 파이프라인
**Depends on**: Phase 4 (Phase 5의 남은 05-04/05-05보다 **먼저** 처리)
**Research**: Unlikely (원인 규명 완료, 아래 근거 참조)
**Why now**: 2026-08-23 코드 검토에서 "실패하지 않고 조용히 잘못된 결과물을 내놓는" 버그 2건 확인. 성능 최적화(05-04/05-05)보다 우선.
**Plans**: 6
**검증**: 2026-08-23 — 무음 1장 + 숨김 1장이 섞인 6장 덱으로 E2E 실행. 수정 전 오디오 62.9s/영상 64.3s(1.5s 누락) → 수정 후 64.3s/64.2s 일치. 숨김 슬라이드 제외 확인 (`output/verify/`)

Plans:
- [x] 05.1-01: **무음 슬라이드 병합 파손 수정** (`src/core/video_composer.py`) 🔴 치명
  - 증상: 노트가 없는 슬라이드는 오디오 스트림이 없는 클립으로 생성되는데, concat demuxer의 `-c copy`는 모든 입력의 스트림 구성이 동일해야 함 → 병합 실패 또는 해당 지점 이후 오디오 소실
  - 해결: 무음 슬라이드에 `anullsrc` 무음 트랙 삽입 + 전 클립의 오디오 파라미터(48kHz/stereo/AAC 192k)와 프레임레이트 강제 통일 + concat `-c copy` 실패 시 재인코딩 폴백
- [x] 05.1-02: **슬라이드-이미지 정렬 어긋남 수정** (`src/core/pptx_parser.py`, `src/worker/tasks.py`) 🔴 치명
  - 증상: `slides_info`는 python-pptx 기준으로 **숨김 슬라이드를 포함**하지만 `image_paths`는 PDF 페이지 기준으로 **숨김 슬라이드를 제외** → 숨김 슬라이드가 1장이라도 있으면 그 이후 전부 대본-이미지가 밀리거나 `image_paths[i]` IndexError
  - 해결: 파서에서 숨김 슬라이드(`<p:sld show="0">`) 제외 + `tasks.py`에서 개수 불일치 시 조용히 진행하지 말고 명확한 에러 발생
- [x] 05.1-03: **업로드 경로 탈출 차단** (`src/api/routes/upload.py`) 🟠 보안
  - `file.filename`을 검증 없이 `os.path.join`에 사용 → `../../x.pptx` 같은 이름이 job 디렉터리 밖에 기록됨. `basename()` 처리 + `MAX_FILE_SIZE_MB` 실제 강제
  - ✅ 완료: `sanitize_filename()` 추가, 1MB 청크 스트리밍으로 용량 초과 시 413, PPTX 매직바이트(`PK\x03\x04`) 검사, `voice_key`/`delay_sec` 범위 검증, 거부 시 job 디렉터리 정리. `download.py`는 `job_id` UUID 형식 검증 추가. `settings.MAX_FILE_SIZE_MB`/`MAX_SLIDES`가 실제로 사용되도록 연결
- [x] 05.1-04: **예외 은닉 제거** (`src/worker/tasks.py`) 🟠
  - `except`가 에러를 dict로 반환해 Celery 상태가 항상 SUCCESS → `jobs.py`의 FAILURE 분기가 죽은 코드가 되고 재시도·Sentry 연동 불가. 예외를 재발생시키고 프론트는 FAILURE 경로로 처리
  - ✅ 완료: `tasks.py`가 `logger.exception()` 후 `raise`. `jobs.py`에 `_error_message()` 추가(예외/dict 모두 처리). `app.js`는 죽은 `result.status==='error'` 분기를 제거하고 FAILURE 경로 + 업로드 4xx 사유 표시로 통일 (`resetToUpload()`)
- [ ] 05.1-05: **WebSocket 실연결 또는 제거** (`src/api/websocket.py`, `src/worker/tasks.py`) 🟡
  - `send_progress()` 호출부가 없어 껍데기 상태. Redis pub/sub으로 워커→API 진행률을 실제로 흘려보내거나, 폴링만 남기고 WebSocket 코드를 삭제 (둘 중 택1)
- [ ] 05.1-06: **회귀 테스트 추가** (`tests/`) 🟡
  - 무음 슬라이드 + 숨김 슬라이드가 섞인 픽스처 PPTX로 파이프라인 E2E 테스트. `docs/05_TEST_CASES.md` 기준 최소 케이스부터

### Phase 6: 회원 & 결제
**Goal**: 이메일 로그인, 무료(월 3회) / 유료(₩9,900~29,900) 플랜, 토스페이먼츠 결제가 동작하는 상용화 준비
**Depends on**: Phase 5
**Research**: Likely (토스페이먼츠 API 연동, JWT 세션 전략)
**Research topics**: 토스페이먼츠 결제 API 현행 문서, FastAPI JWT 인증 라이브러리 선택 (python-jose vs authlib), 소셜 로그인 (Google OAuth2) 연동 패턴
**Plans**: TBD

Plans:
- [ ] 06-01: `src/models/user.py` + 인증 미들웨어 — 이메일 회원가입·로그인·JWT
- [ ] 06-02: 플랜 쿼터 미들웨어 — 무료/유료 사용량 체크, 초과 시 429 반환
- [ ] 06-03: 토스페이먼츠 결제 연동 — 구독 결제 흐름 + 웹훅 처리

### Phase 7: 클라우드 배포 (서버 분리 아키텍처)
**Goal**: `docker-compose up`으로 프로덕션 환경이 올라오고, 서버 부하를 고려해 API와 Worker 역할을 분리하여 AWS에 배포
**Depends on**: Phase 6
**Research**: Likely (AWS EC2 + S3 + CloudFront 설정 패턴, Nginx reverse proxy)
**Research topics**: API 서버(경량)와 Worker 서버(CPU 중심) 인스턴스 분리 전략, AWS ElastiCache(Redis) 구성, S3 presigned URL
**Plans**: TBD

Plans:
- [ ] 07-01: 인프라 역할 분리 아키텍처 구성 — API 서버(t4g.small) / Worker 서버(c7g.xlarge) 분리용 `docker-compose.prod.yml` 작성
- [ ] 07-02: AWS S3 연동 — 완성된 영상 및 자막을 S3로 업로드하고 로컬 디스크 완전 비우기
- [ ] 07-03: Linux 폰트 셋팅 자동화 — Ubuntu 서버 내 LibreOffice 렌더링을 위한 한글 폰트(맑은 고딕 등) 설치 스크립트 작성
- [ ] 07-04: AWS EC2 배포 + Nginx + SSL — Route53 도메인, ACM 인증서
- [ ] 07-05: 모니터링 — Sentry 에러 추적, CloudWatch 로그 및 Auto-scaling 설정

### Phase 8: YouTube 연동
**Goal**: 영상 생성 완료 시 다국어 SRT 자막·챕터·썸네일·메타데이터가 포함된 YouTube 패키지 ZIP을 다운로드하거나 YouTube에 직접 업로드 가능
**Depends on**: Phase 7
**Research**: Likely (YouTube Data API v3 현행 문서, OAuth2 인증 흐름)
**Research topics**: YouTube Data API v3 영상 업로드·자막 업로드 엔드포인트, OAuth2 서버사이드 흐름, deep-translator Google Translate API 현행 제한
**Plans**: TBD

Plans:
- [ ] 08-01: `src/core/translator.py` — deep-translator 기반 다국어 스크립트 번역 (한/영/일/중)
- [ ] 08-02: SRT + 챕터 + 썸네일 + 메타데이터 자동 생성 (`youtube_metadata.json`)
- [ ] 08-03: YouTube 패키지 ZIP 다운로드 API
- [ ] 08-04: YouTube Data API v3 자동 업로드 (OAuth2 인증 포함)

## Progress

**Execution Order:** 1 → 2 → 3 → 4 (MVP) → 5(부분) → **5.1 (긴급 버그 수정)** → 5(05-04, 05-05) → 6 → 7 → 8

**작업 우선순위 (2026-08-23 검토 반영):**

| 순위 | 작업 | 근거 |
|------|------|------|
| 1 | 05.1-01 무음 슬라이드 병합 파손 | 실패 없이 결과물이 조용히 망가짐 |
| 2 | 05.1-02 슬라이드-이미지 정렬 | 실패 없이 나레이션이 통째로 밀림 |
| 3 | 05.1-03 경로 탈출 + 용량 제한 | 짧게 끝나는 보안 수정 |
| 4 | 05.1-04 예외 은닉 제거 | 이후 모든 운영/모니터링의 전제 |
| 5 | 05-04 TTS 병렬화 | 슬라이드 수에 비례해 체감 속도 개선 |
| 6 | 05-05 임시파일 GC | `/tmp` 무한 증가 방지 |
| 7 | 05.1-05 WebSocket 정리 | 중복 구현(폴링/WS) 중 하나 정리 |
| 8 | 05-01 voices.py + 05.1-06 테스트 | 문서-코드 불일치 해소 |

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 프로젝트 기반 구축 | 3/3 | Completed | Yes |
| 2. 핵심 처리 파이프라인 | 4/4 | Completed | Yes |
| 3. 비동기 작업 시스템 | 4/4 | Completed | Yes |
| 4. 웹 인터페이스 (MVP) | 3/3 | Completed | Yes |
| 5. 품질 및 성능 개선 | 2/5 | In progress | - |
| 5.1 치명 버그 수정 (긴급) | 4/6 | In progress | - |
| 6. 회원 & 결제 | 0/3 | Not started | - |
| 7. 클라우드 배포 | 0/4 | Not started | - |
| 8. YouTube 연동 | 0/4 | Not started | - |
