# Project: SlideNarrator

## Core Value

PPTX 파일 하나로 AI 음성 나레이션 영상을 자동 생성 — 별도 녹화·장비·성우 없이 슬라이드 노트가 곧 대본.

## Problem

발표 영상 제작의 Pain Points:
1. 녹화·편집에 수 시간 소요
2. 마이크·조용한 환경 확보 어려움
3. 일부 수정 시 전체 재녹화 필요
4. 외국어 발표 한계
5. 전문 성우 고용 비용

## Solution

```
PPTX 업로드 (슬라이드 노트 = 발표 스크립트)
        ↓
슬라이드 이미지 + AI 음성 자동 생성
        ↓
MP4 영상 다운로드
```

수정 시 해당 슬라이드만 재생성 → 전체 재녹화 불필요.

## Target Users

- 기업 발표자 (~20만 명): 녹화 시간 절약, 수정 용이
- 이러닝 강사 (~10만 명): 강의 영상 빠른 제작
- 글로벌 비즈니스: 다국어 발표 자료
- YouTube 크리에이터 (~15만 명): 슬라이드 기반 콘텐츠

## MVP Success Criteria (Phase 1~4 완료 시점)

| 지표 | 목표 |
|------|------|
| 영상 생성 성공률 | 95% 이상 |
| 슬라이드 1장당 처리 시간 | 10초 이내 |
| 지원 파일 형식 | PPTX |
| 지원 언어 | 한국어, 영어 |
| 동시 처리 | 5건 이상 |

## Tech Stack

| 레이어 | 기술 |
|--------|------|
| 언어 | Python 3.11+ |
| 웹 프레임워크 | FastAPI 0.110+ |
| 비동기 작업 | Celery 5.3+ + Redis 7.0+ |
| DB | PostgreSQL 15+ + SQLAlchemy 2.0+ |
| PPTX 파싱 | python-pptx 0.6.23+ |
| 이미지 변환 | LibreOffice headless + PyMuPDF |
| TTS | edge-tts (무료) / OpenAI TTS (유료) |
| 영상 합성 | ffmpeg-python 0.2+ |
| 자막 | python-srt 3.5+ |
| 프론트엔드 | Vanilla HTML/CSS/JS (MVP), React (이후) |
| 배포 | Docker + AWS EC2/S3 |

## Architecture

```
Browser ←→ WebSocket (진행 상황)
    ↕ HTTP/HTTPS
FastAPI Server
    ↕ 작업 큐
Redis → Celery Worker
           ↓
  [PPTX 파싱] → [TTS 생성] → [영상 합성] → [S3 저장]
   python-pptx   edge-tts     ffmpeg      boto3
```

## Key Constraints

- 최대 파일 크기: 100MB
- 최대 슬라이드: 100장
- 최대 영상 길이: 60분
- 생성 영상 보관: 24시간 후 삭제
- HTTPS 필수

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-07 | TTS 기본 엔진: edge-tts | 무료, Azure Neural TTS 품질, 한국어 지원 |
| 2026-05-07 | MVP UI: Vanilla JS | 빠른 프로토타이핑, React 전환은 Phase 5 이후 |
| 2026-05-07 | 비동기: Celery + Redis | 영상 처리 시간이 길어 백그라운드 처리 필수 |
| 2026-05-07 | 결제: 토스페이먼츠 | 한국 서비스 특화, 간편한 연동 |

## Business Model

| 플랜 | 가격 | 제한 |
|------|------|------|
| 무료 | ₩0 | 월 3회, 10분 이하 |
| Basic | ₩9,900/월 | 월 20회, 30분 이하 |
| Pro | ₩29,900/월 | 무제한, 60분 이하 |
