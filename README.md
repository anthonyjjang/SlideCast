# SlideNarrator — 발표자료 자동 영상 변환 서비스

> PPTX 파일 하나로 AI 음성 나레이션 영상을 자동 생성하는 서비스

---

## 핵심 가치

```
PPTX 업로드 (슬라이드 노트 = 발표 스크립트)
        ↓
슬라이드 이미지 + AI 음성 자동 생성
        ↓
MP4 영상 다운로드
```

**별도 스크립트 작업 불필요 — 슬라이드 노트가 곧 대본**

---

## 주요 기능

- PPTX 슬라이드 노트 자동 추출
- 슬라이드별 AI 음성 생성 (한국어/영어/일본어/중국어 등)
- 슬라이드 전환 씽크 자동 맞춤
- 다양한 목소리 선택 (성별, 톤)
- MP4 다운로드 (Full HD 1920×1080)
- **YouTube 패키지 자동 생성** (자막 SRT + 챕터 + 썸네일 + 메타데이터)
- **다국어 자막 SRT** → YouTube 자동 번역 활성화

---

## 문서 목록

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

---

## 빠른 시작 (로컬)

```bash
# 의존성 설치
pip install -r requirements.txt
brew install ffmpeg libreoffice

# 서버 실행
uvicorn src.main:app --reload

# 접속
open http://localhost:8000
```

---

## 프로젝트 관리 (GSD 로드맵)

본 프로젝트는 Claude Code의 `GSD(Get Shit Done)` 워크플로우를 활용하여 개발 마일스톤을 체계적으로 관리합니다. 프로젝트의 목표 및 진행 상태는 `.planning/` 디렉터리에 문서화되어 있습니다.

- **`PROJECT.md`**: 프로젝트 핵심 가치 및 목표 정의
- **`ROADMAP.md`**: 전체 개발 로드맵 (Phase 1 ~ Phase 8)
- **`STATE.md`**: 현재 진행 중인 Phase 및 작업 상태 기록

### 현재 작업 진행 현황 (Current Status)

> **현재 단계: Phase 1 — 프로젝트 기반 구축 (MVP 시작)**

현재 코어 로직 개발을 위한 애플리케이션 초기 뼈대 작업을 진행 중입니다.
- **진행 중인 작업**:
  - FastAPI 진입점(`main.py`) 및 `src/` 디렉터리 구조 초기화
  - `requirements.txt` 패키지 의존성 설정
  - `docker-compose.yml` 및 `.env.example` 등 환경/배포 설정
  - 데이터베이스 마이그레이션 세팅

---

## 기술 스택 요약

```
Frontend  : HTML/CSS/JS (Vanilla → React 전환 예정)
Backend   : FastAPI (Python 3.11+)
TTS       : Microsoft Edge TTS / OpenAI TTS
영상 합성  : ffmpeg
PPTX 파싱 : python-pptx
배포      : Docker + AWS EC2 / Railway
```
