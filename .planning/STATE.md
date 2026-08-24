# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** PPTX 파일 하나로 AI 음성 나레이션 영상을 자동 생성 — 슬라이드 노트가 곧 대본
**Current focus:** Phase 5.1 — 치명 버그 수정 및 안정화 (4/6 완료)

## Current Position

Phase: 5.1 of 8 (치명 버그 수정 및 안정화 · 긴급)
Plan: 05.1-05 (WebSocket 실연결 또는 제거) — 다음 착수 대상
Status: In progress
Last activity: 2026-08-24 — Phase 5.1 버그 4건 수정 + 퀵 가이드 덱 작성, main 머지 및 origin 푸시 완료

Progress: ███████░░░ 약 65% (Phase 1~4 완료, 5는 2/5, 5.1은 4/6)

## Performance Metrics

**Velocity:**
- Total plans completed: 20 (01~04 전체 13, 05 부분 2, 05.1 부분 4, 가이드 1)
- Recent session: 2026-08-23~24 — 코드 검토 → 버그 수정 4건 → 가이드 덱 → 머지/푸시

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. 프로젝트 기반 구축 | 3/3 | Completed (01-03은 부분 — DB 미연결) |
| 2. 핵심 처리 파이프라인 | 4/4 | Completed |
| 3. 비동기 작업 시스템 | 4/4 | Completed (03-03은 부분 — pub/sub 미구현) |
| 4. 웹 인터페이스 (MVP) | 3/3 | Completed (04-02는 부분 — 스크립트 편집 없음) |
| 5. 품질 및 성능 개선 | 2/5 | In progress |
| 5.1 치명 버그 수정 (긴급) | 4/6 | In progress |
| 6~8 | 0/11 | Not started |

## Accumulated Context

### Decisions

**2026-08-23 — 성능 최적화보다 버그 수정을 먼저 처리**
코드 검토에서 "실패하지 않고 조용히 잘못된 결과물을 내놓는" 버그 2건을 발견해
Phase 5.1을 신설하고, Phase 5의 남은 05-04/05-05보다 앞서 실행하기로 결정.

**2026-08-23 — 클립 규격을 강제 통일**
concat demuxer의 `-c copy`가 성립하려면 모든 클립의 스트림 구성이 같아야 하므로,
edge-tts 원본(24kHz 모노)과 무관하게 전 클립을 48kHz/stereo/AAC 192k/30fps로 고정.
무음 슬라이드에도 `anullsrc` 트랙을 넣는다.

**2026-08-23 — 숨김 슬라이드는 파서 단계에서 제외**
Keynote/LibreOffice PDF 내보내기가 숨김 슬라이드를 건너뛰므로, python-pptx 쪽에서도
`<p:sld show="0">`을 제외해 대본과 이미지의 1:1 대응을 보장. 개수가 어긋나면 즉시 실패.

**2026-08-23 — 워커 예외는 삼키지 않고 raise**
dict 반환은 Celery 상태를 항상 SUCCESS로 만들어 재시도·모니터링을 무력화한다.

### Deferred Issues

- **Keynote AppleScript에 타임아웃 없음** — Keynote가 다이얼로그를 띄우면 워커가 무한 대기.
  비대화형 환경에서는 권한 문제로 실패해 LibreOffice로 폴백된다 (폴백은 정상 동작 확인).
- **DB 미연결** — `models/job.py`, `slide.py`가 어디서도 import되지 않는다. 작업 상태는
  Celery 결과 백엔드(Redis)에만 존재하며 만료되면 소실. Phase 6 진입 전 해결 필요.
- **WebSocket 껍데기** — `send_progress()` 호출부가 없어 진행률은 폴링으로만 동작 (05.1-05).
- **`voices.py` 부재** — 목소리 목록이 `index.html`에 하드코딩(4종)되어 `tts_engine.VOICES`(6종)와 불일치.
- **테스트 없음** — `tests/`가 비어 있다 (05.1-06).

### Blockers/Concerns

없음. 로컬에서 영상 생성은 정상 동작한다.

## Session Continuity

Last session: 2026-08-24
Stopped at: Phase 5.1 4/6 완료. main 머지 + origin 푸시 완료, 기능 브랜치 삭제.
Next: 05-04 (TTS 병렬화) 또는 05.1-05 (WebSocket 정리)
Resume file: None

### 검증 자산

- `docs/guide/SlideCast_퀵가이드.pptx` — 14장 가이드 덱. 노트 포함이라 그대로 파이프라인 입력으로 쓸 수 있다.
- `scripts/make_guide_deck.py` — 위 덱 재생성기.
- `output/guide/` (gitignore) — 위 덱으로 생성한 6분 36초 영상 + SRT.
- 회귀 검증 기준: 무음 슬라이드 + 숨김 슬라이드가 섞인 덱으로 영상/오디오 길이가 일치하는지 확인.
