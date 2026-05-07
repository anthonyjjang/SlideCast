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
- [ ] 01-01: FastAPI 앱 뼈대 + 디렉터리 구조 (`src/main.py`, `src/config.py`, `src/api/`)
- [ ] 01-02: `requirements.txt`, `.env.example`, `docker-compose.yml` (API + Redis + PostgreSQL)
- [ ] 01-03: DB 모델 + Alembic 마이그레이션 초기화 (`jobs`, `slides` 테이블)

### Phase 2: 핵심 처리 파이프라인
**Goal**: `python pipeline.py sample.pptx` 한 줄로 PPTX → 슬라이드 이미지 → MP3 → MP4 변환이 완료되는 독립 실행 파이프라인
**Depends on**: Phase 1
**Research**: Unlikely (라이브러리 명세가 docs/03_TECH_SPEC.md에 확정됨)
**Plans**: TBD

Plans:
- [ ] 02-01: `src/core/pptx_parser.py` — PPTX 슬라이드 노트·제목 추출
- [ ] 02-02: `src/core/image_converter.py` — LibreOffice headless로 PPTX → PNG 변환
- [ ] 02-03: `src/core/tts_engine.py` — edge-tts 음성 생성, 목소리 설정
- [ ] 02-04: `src/core/video_composer.py` — ffmpeg로 PNG + MP3 → MP4 합성

### Phase 3: 비동기 작업 시스템
**Goal**: API로 PPTX를 업로드하면 Celery가 백그라운드 처리하고, WebSocket으로 실시간 진행률을 받을 수 있는 백엔드 완성
**Depends on**: Phase 2
**Research**: Likely (Celery + FastAPI WebSocket 연동 패턴 확인 필요)
**Research topics**: Celery + FastAPI 연동 방식 (shared_task vs app.task), Redis pub/sub으로 WebSocket 진행률 푸시 패턴, SQLAlchemy 2.0 async 세션 관리
**Plans**: TBD

Plans:
- [ ] 03-01: `src/worker/celery_app.py` + `src/worker/tasks.py` — 파이프라인 비동기 실행
- [ ] 03-02: `src/api/routes/upload.py` + `src/api/routes/jobs.py` — 업로드·작업 조회 API
- [ ] 03-03: `src/api/websocket.py` — Redis pub/sub 기반 실시간 진행 상황 WebSocket
- [ ] 03-04: `src/api/routes/download.py` — 완료 영상 다운로드 (로컬 파일 or S3 presigned URL)

### Phase 4: 웹 인터페이스 (MVP 완성)
**Goal**: 브라우저에서 PPTX를 업로드하고, 스크립트를 확인·편집하고, 진행률을 보면서 MP4를 다운로드할 수 있는 완전한 MVP
**Depends on**: Phase 3
**Research**: Unlikely (Vanilla JS + Dropzone.js, 내부 API 패턴 확립됨)
**Plans**: TBD

Plans:
- [ ] 04-01: `src/static/index.html` + `style.css` — 업로드 UI (Dropzone.js 드래그앤드롭)
- [ ] 04-02: `src/static/app.js` — 스크립트 편집 + 설정 선택 (목소리·딜레이·해상도) UI
- [ ] 04-03: `src/static/app.js` — WebSocket 진행 표시 + 완료 화면 + 다운로드 버튼

### Phase 5: 품질 개선
**Goal**: 목소리 샘플 미리 듣기, SRT 자막 생성, 슬라이드별 딜레이 조정, 에러 재시도 처리가 동작하는 개선판
**Depends on**: Phase 4
**Research**: Unlikely (내부 모듈 확장)
**Plans**: TBD

Plans:
- [ ] 05-01: `src/api/routes/voices.py` — 목소리 목록 + 샘플 미리 듣기 API
- [ ] 05-02: `src/core/subtitle_maker.py` — 슬라이드 타임스탬프 기반 SRT 자막 생성
- [ ] 05-03: 에러 핸들링 강화 — Celery 재시도 로직, 실패 슬라이드 재생성 API
- [ ] 05-04: `src/api/routes/jobs.py` — 슬라이드별 재생성 엔드포인트 (`POST /jobs/{id}/slides/{no}/regenerate`)

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

### Phase 7: 클라우드 배포
**Goal**: `docker-compose up`으로 프로덕션 환경이 올라오고, AWS에서 HTTPS로 서비스가 접근 가능한 상태
**Depends on**: Phase 6
**Research**: Likely (AWS EC2 + S3 + CloudFront 설정 패턴, Nginx reverse proxy)
**Research topics**: AWS EC2 t3.medium Docker 배포 패턴, S3 + CloudFront presigned URL 만료 전략, Sentry + CloudWatch 연동
**Plans**: TBD

Plans:
- [ ] 07-01: `Dockerfile` 최적화 + `docker-compose.prod.yml` — 프로덕션 컨테이너 구성
- [ ] 07-02: AWS S3 연동 — 완료 영상 저장 + presigned URL 다운로드
- [ ] 07-03: AWS EC2 배포 + Nginx + SSL — Route53 도메인, ACM 인증서
- [ ] 07-04: 모니터링 — Sentry 에러 추적, CloudWatch 로그

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

**Execution Order:** 1 → 2 → 3 → 4 (MVP) → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 프로젝트 기반 구축 | 0/3 | Not started | - |
| 2. 핵심 처리 파이프라인 | 0/4 | Not started | - |
| 3. 비동기 작업 시스템 | 0/4 | Not started | - |
| 4. 웹 인터페이스 (MVP) | 0/3 | Not started | - |
| 5. 품질 개선 | 0/4 | Not started | - |
| 6. 회원 & 결제 | 0/3 | Not started | - |
| 7. 클라우드 배포 | 0/4 | Not started | - |
| 8. YouTube 연동 | 0/4 | Not started | - |
