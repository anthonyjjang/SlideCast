# 03. 기술 스펙

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│           HTML/CSS/JS  ←→  WebSocket (진행상황)      │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────┐
│                 FastAPI Server                       │
│   /upload  /status  /download  /voices              │
└──────┬────────────────────────┬─────────────────────┘
       │ 작업 큐                 │ 결과 조회
┌──────▼──────┐          ┌──────▼──────┐
│    Redis    │          │  PostgreSQL  │
│  (작업 큐)  │          │  (메타데이터)│
└──────┬──────┘          └─────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│              Celery Worker (비동기 처리)              │
│                                                      │
│  [PPTX 파싱] → [TTS 생성] → [영상 합성] → [S3 저장] │
│   python-pptx   edge-tts     ffmpeg      boto3       │
└─────────────────────────────────────────────────────┘
                                    │
                             ┌──────▼──────┐
                             │   AWS S3    │
                             │ (결과 영상) │
                             └─────────────┘
```

---

## 2. 기술 스택

### 백엔드

| 항목 | 기술 | 버전 | 선택 이유 |
|------|------|------|---------|
| 언어 | Python | 3.11+ | TTS/영상 라이브러리 생태계 |
| 웹 프레임워크 | FastAPI | 0.110+ | 비동기, 자동 API 문서, 빠른 개발 |
| 비동기 작업 | Celery | 5.3+ | 영상 생성 백그라운드 처리 |
| 메시지 브로커 | Redis | 7.0+ | 작업 큐, 진행 상황 pub/sub |
| 데이터베이스 | PostgreSQL | 15+ | 작업 이력, 사용자 정보 |
| ORM | SQLAlchemy | 2.0+ | 비동기 ORM |

### 핵심 처리 모듈

| 항목 | 라이브러리 | 버전 | 용도 |
|------|----------|------|------|
| PPTX 파싱 | python-pptx | 0.6.23+ | 슬라이드 노트/이미지 추출 |
| PPTX→이미지 | LibreOffice (headless) | 7.6+ | PPTX → PDF → PNG 변환 |
| PDF→이미지 | PyMuPDF (fitz) | 1.23+ | PDF 페이지 → PNG |
| TTS (무료) | edge-tts | 6.1+ | Microsoft Azure Neural TTS |
| TTS (유료) | openai | 1.0+ | OpenAI TTS API (고품질) |
| 번역 | deep-translator | 1.11+ | 다국어 스크립트 번역 |
| 영상 합성 | ffmpeg-python | 0.2+ | 이미지+오디오→MP4 |
| 자막 | python-srt | 3.5+ | SRT 자막 파일 생성 |

### 프론트엔드

| 항목 | 기술 | 용도 |
|------|------|------|
| MVP | Vanilla HTML/CSS/JS | 빠른 프로토타이핑 |
| 이후 | React + TypeScript | 컴포넌트화, 상태 관리 |
| UI 컴포넌트 | Tailwind CSS | 빠른 스타일링 |
| 실시간 통신 | WebSocket (FastAPI) | 진행 상황 실시간 표시 |
| 파일 업로드 | Dropzone.js | 드래그 앤 드롭 |

### 인프라 / DevOps

| 항목 | 기술 | 용도 |
|------|------|------|
| 컨테이너 | Docker + Docker Compose | 로컬/배포 환경 통일 |
| 클라우드 | AWS EC2 (t3.medium) | 서버 |
| 스토리지 | AWS S3 | 결과 파일 저장 |
| CDN | AWS CloudFront | S3 파일 배포 속도 |
| 도메인/SSL | Route53 + ACM | HTTPS |
| 모니터링 | Sentry + CloudWatch | 에러 추적, 로그 |

---

## 3. 라이브러리 상세

### python-pptx — PPTX 파싱

```python
from pptx import Presentation

def extract_notes(pptx_path):
    prs = Presentation(pptx_path)
    slides = []
    for i, slide in enumerate(prs.slides):
        notes = ""
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text
        slides.append({"slide_no": i+1, "notes": notes.strip()})
    return slides
```

### edge-tts — 무료 TTS

```python
import edge_tts, asyncio

VOICES = {
    "ko_male":   "ko-KR-HyunsuMultilingualNeural",
    "ko_female": "ko-KR-SunHiNeural",
    "en_male":   "en-US-GuyNeural",
    "en_female": "en-US-JennyNeural",
    "ja_male":   "ja-JP-KeitaNeural",
    "zh_male":   "zh-CN-YunxiNeural",
}

async def generate_tts(text, voice_key, output_path, rate=0):
    rate_str = f"+{rate}%" if rate >= 0 else f"{rate}%"
    communicate = edge_tts.Communicate(text, VOICES[voice_key], rate=rate_str)
    await communicate.save(output_path)
```

### deep-translator — 다국어 번역

```python
from deep_translator import GoogleTranslator

def translate_script(text, target_lang="en"):
    translator = GoogleTranslator(source="auto", target=target_lang)
    # 2000자 초과 시 청크 분할
    if len(text) > 2000:
        chunks = [text[i:i+2000] for i in range(0, len(text), 2000)]
        return " ".join(translator.translate(c) for c in chunks)
    return translator.translate(text)
```

### ffmpeg-python — 영상 합성

```python
import ffmpeg

def create_slide_video(img_path, audio_path, out_path, delay_sec=1.5):
    delay_ms = int(delay_sec * 1000)
    audio_dur = float(ffmpeg.probe(audio_path)["format"]["duration"])
    total_dur = audio_dur + delay_sec

    (
        ffmpeg
        .input(img_path, loop=1, framerate=1)
        .output(
            ffmpeg.input(audio_path).audio
            .filter("adelay", f"{delay_ms}|{delay_ms}"),
            out_path,
            vf="scale=1920:1080:force_original_aspect_ratio=decrease,"
               "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
            vcodec="libx264", preset="fast", crf=18,
            acodec="aac", audio_bitrate="192k",
            pix_fmt="yuv420p", t=total_dur
        )
        .overwrite_output()
        .run(quiet=True)
    )
```

---

## 4. 데이터베이스 스키마

```sql
-- 작업 테이블
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    status      VARCHAR(20) DEFAULT 'pending',  -- pending/processing/done/failed
    file_name   VARCHAR(255),
    slide_count INTEGER,
    settings    JSONB,           -- 목소리, 딜레이, 해상도 등
    progress    INTEGER DEFAULT 0, -- 0~100
    output_url  TEXT,            -- S3 URL
    error_msg   TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 슬라이드 테이블
CREATE TABLE slides (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
    slide_no    INTEGER,
    script_original TEXT,        -- 원본 노트
    script_edited   TEXT,        -- 편집된 스크립트
    script_translated JSONB,     -- {"en": "...", "ja": "..."}
    audio_url   TEXT,            -- 개별 MP3 URL
    duration    FLOAT,           -- 오디오 길이(초)
    status      VARCHAR(20) DEFAULT 'pending'
);

-- 사용자 테이블 (Phase 3)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE,
    plan        VARCHAR(20) DEFAULT 'free',   -- free/basic/pro
    usage_count INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 5. 디렉터리 구조

```
src/
├── main.py                  # FastAPI 앱 진입점
├── config.py                # 환경 변수 설정
├── api/
│   ├── routes/
│   │   ├── upload.py        # 파일 업로드 API
│   │   ├── jobs.py          # 작업 조회/취소 API
│   │   ├── voices.py        # 목소리 목록 API
│   │   └── download.py      # 다운로드 API
│   └── websocket.py         # 실시간 진행 상황
├── core/
│   ├── pptx_parser.py       # PPTX 파싱 모듈
│   ├── image_converter.py   # PPTX→이미지 변환
│   ├── tts_engine.py        # TTS 생성 모듈
│   ├── translator.py        # 다국어 번역 모듈
│   ├── video_composer.py    # ffmpeg 영상 합성
│   └── subtitle_maker.py    # SRT 자막 생성
├── worker/
│   ├── celery_app.py        # Celery 설정
│   └── tasks.py             # 비동기 작업 정의
├── models/
│   ├── job.py               # Job DB 모델
│   └── slide.py             # Slide DB 모델
└── static/
    ├── index.html           # 메인 UI
    ├── style.css
    └── app.js
```

---

## 6. 환경 변수 (.env)

```env
# 서버
APP_HOST=0.0.0.0
APP_PORT=8000
SECRET_KEY=your-secret-key

# 데이터베이스
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/slidenarrator

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=slidenarrator-outputs

# TTS
OPENAI_API_KEY=          # 유료 TTS 사용 시
TTS_DEFAULT_ENGINE=edge  # edge or openai

# LibreOffice
LIBREOFFICE_PATH=/usr/bin/soffice

# 파일 제한
MAX_FILE_SIZE_MB=100
MAX_SLIDES=100
OUTPUT_EXPIRE_HOURS=24
```

---

## 7. 지원 목소리 목록

### 한국어

| ID | 이름 | 성별 | 특징 |
|----|------|------|------|
| ko_male_hyunsu | Hyunsu | 남성 | 부드럽고 자연스러움 |
| ko_male_injoon | InJoon | 남성 | 또렷한 발표 톤 |
| ko_female_sunhi | SunHi | 여성 | 친근하고 밝음 |

### 영어

| ID | 이름 | 성별 | 특징 |
|----|------|------|------|
| en_male_guy | Guy | 남성 | 자연스러운 미국 영어 |
| en_female_jenny | Jenny | 여성 | 명확한 발음 |
| en_male_ryan | Ryan | 남성 | 영국 영어 |

### 다국어 (추후 확장)

| 언어 | 코드 | 대표 목소리 |
|------|------|-----------|
| 일본어 | ja | ja-JP-KeitaNeural |
| 중국어 | zh | zh-CN-YunxiNeural |
| 스페인어 | es | es-ES-AlvaroNeural |
| 프랑스어 | fr | fr-FR-HenriNeural |
| 독일어 | de | de-DE-ConradNeural |

---

## 8. 영상 내 섹션 구분 기능 (Phase 4)

### 개념

```
[영상 구조]

┌─────────────────────┐   ← 오프닝 목차 카드 (선택)
│  📋 전체 목차       │      "I. 소개 / II. 제안 개요 / ..."
└─────────────────────┘
          ↓
┌─────────────────────┐   ← 섹션 1 타이틀 카드 (2초)
│  I. 제안업체 소개   │
└─────────────────────┘
          ↓
  슬라이드 1~7 (연속 재생)
          ↓
┌─────────────────────┐   ← 섹션 2 타이틀 카드 (2초)
│  II. 제안 개요      │
└─────────────────────┘
          ↓
  슬라이드 8~17 (연속 재생)
          ↓
       ...
```

### 섹션 자동 감지 방법

```python
def detect_sections(slides: list[dict]) -> list[dict]:
    """
    PPTX B열(목차) 값이 변경되는 지점을 섹션 경계로 인식
    또는 슬라이드 제목이 로마 숫자(I, II, III...)로 시작하는 경우
    """
    sections = []
    current_section = None

    for slide in slides:
        chapter = slide.get("chapter", "")          # B열 목차
        title   = slide.get("slide_title", "")

        is_section_start = (
            chapter != current_section or
            bool(re.match(r'^[IVX]+\.', title))     # 로마 숫자 섹션 제목
        )

        if is_section_start and chapter:
            current_section = chapter
            sections.append({
                "section_title": chapter,
                "start_slide":   slide["slide_no"],
                "slides":        []
            })

        if sections:
            sections[-1]["slides"].append(slide)

    return sections
```

### 섹션 타이틀 카드 생성 (ffmpeg)

```python
def create_section_title_card(
    section_no: int,
    section_title: str,
    duration: float = 2.5,
    style: dict = None,
    output_path: str = None
):
    """
    ffmpeg drawtext 필터로 섹션 타이틀 카드 영상 생성
    style: {"bg_color": "#1a1a2e", "text_color": "white", "font_size": 72}
    """
    style = style or {"bg_color": "#1a1a2e", "text_color": "white", "font_size": 72}
    roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    number = roman[section_no - 1] if section_no <= 10 else str(section_no)

    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c={style['bg_color']}:size=1920x1080:rate=30",
        "-vf", (
            f"drawtext=text='{number}.':fontcolor={style['text_color']}:"
            f"fontsize={style['font_size'] + 20}:x=(w-text_w)/2:y=(h-text_h)/2-60,"
            f"drawtext=text='{section_title}':fontcolor={style['text_color']}:"
            f"fontsize={style['font_size']}:x=(w-text_w)/2:y=(h-text_h)/2+20,"
            f"fade=t=in:st=0:d=0.3,fade=t=out:st={duration-0.3}:d=0.3"
        ),
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast",
        "-pix_fmt", "yuv420p",
        output_path
    ], check=True)
```

### 섹션 진행 인디케이터 오버레이

```python
def add_section_indicator(
    video_path: str,
    sections: list[dict],
    current_section_idx: int,
    output_path: str
):
    """
    영상 하단에 섹션 진행 인디케이터 바 추가
    예: [● I. 소개] [○ II. 제안] [○ III. 구축방안] ...
    """
    indicators = []
    for i, sec in enumerate(sections):
        dot = "●" if i == current_section_idx else "○"
        indicators.append(f"{dot} {sec['section_title'][:8]}")
    indicator_text = "  ".join(indicators)

    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", (
            f"drawtext=text='{indicator_text}':"
            f"fontcolor=white:fontsize=24:"
            f"x=(w-text_w)/2:y=h-50:"
            f"box=1:boxcolor=black@0.5:boxborderw=8"
        ),
        "-c:v", "libx264", "-preset", "fast",
        "-c:a", "copy", output_path
    ], check=True)
```

### 전체 섹션 영상 조합 흐름

```python
async def compose_sectioned_video(job: dict, settings: dict):
    all_segments = []

    # 1. 오프닝 목차 카드 (선택)
    if settings.get("show_toc_card"):
        toc_card = create_toc_card(job["sections"])
        all_segments.append(toc_card)

    # 2. 섹션별 처리
    for i, section in enumerate(job["sections"]):
        # 섹션 타이틀 카드 삽입
        title_card = create_section_title_card(
            section_no=i + 1,
            section_title=section["section_title"],
            duration=settings.get("title_card_duration", 2.5),
            style=settings.get("style", {})
        )
        all_segments.append(title_card)

        # 해당 섹션 슬라이드 영상들
        for slide in section["slides"]:
            slide_video = create_slide_video(slide, settings)
            # 섹션 인디케이터 오버레이
            if settings.get("show_indicator"):
                slide_video = add_section_indicator(slide_video, job["sections"], i)
            all_segments.append(slide_video)

    # 3. 전체 합치기
    concat_videos(all_segments, job["output_path"])
```

### 지원 타이틀 카드 스타일

| 스타일 | 배경색 | 설명 |
|--------|--------|------|
| `dark` (기본) | `#1a1a2e` 네이비 | 전문적, 무게감 |
| `modern` | `#2d2d2d` 다크그레이 | 세련된 느낌 |
| `corporate` | `#003366` 딥블루 | 기업 발표용 |
| `clean` | `#f8f9fa` 화이트 | 깔끔한 미니멀 |
| `custom` | 사용자 지정 | hex 코드 직접 입력 |

### DB 스키마 추가

```sql
-- 섹션 테이블
CREATE TABLE sections (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE,
    section_no    INTEGER,
    section_title VARCHAR(255),
    start_slide   INTEGER,
    end_slide     INTEGER,
    title_card_url TEXT           -- 섹션 타이틀 카드 영상 URL
);
```

### 섹션 설정 API

```
PATCH /jobs/{job_id}/sections
{
  "enable_sections": true,
  "show_toc_card": true,
  "title_card_duration": 2.5,
  "show_indicator": true,
  "style": "corporate",
  "sections": [
    {"section_no": 1, "title": "I. 제안업체 소개", "start_slide": 1},
    {"section_no": 2, "title": "II. 제안 개요",    "start_slide": 8},
    {"section_no": 3, "title": "III. 구축 방안",  "start_slide": 18}
  ]
}
```
