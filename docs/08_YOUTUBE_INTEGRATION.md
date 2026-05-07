# 08. YouTube 연동 가이드

---

## 1. 개요

SlideNarrator가 생성한 영상을 YouTube에 최적화된 형태로 자동 등록.
슬라이드 타임스탬프 기반 자막·챕터를 자동 생성하여 **YouTube 다국어 자동 번역** 활성화.

```
[SlideNarrator 처리 결과]
  ├── 발표_영상.mp4          ← 영상 본체
  ├── 자막_ko.srt            ← 한국어 자막 (SRT)
  ├── 자막_en.srt            ← 영어 자막 (SRT) → YouTube 자동 번역 기반
  ├── 자막_ja.srt            ← 일본어 자막 (SRT)
  ├── youtube_metadata.json  ← 제목, 설명, 태그, 챕터
  └── thumbnail.png          ← 썸네일 (첫 슬라이드)
          ↓
  [YouTube Data API v3 자동 업로드]
          ↓
  YouTube 영상 등록 완료
  (다국어 자막 포함, 챕터 자동 설정)
```

---

## 2. YouTube 등록 요소별 자동 생성

### 2-1. SRT 자막 파일 (자동 번역의 핵심)

**SRT 형식:**
```
1
00:00:01,500 --> 00:00:38,000
안녕하십니까, 지금부터 BNK 부산은행 모바일 웹 대출 서비스 구축 제안 발표를 시작하겠습니다.

2
00:00:39,500 --> 00:01:10,700
저희는 오늘 약 40분 동안 크게 여섯 가지 파트로 말씀드리겠습니다.

3
00:01:12,200 --> 00:01:20,300
먼저 저희 모빌씨앤씨를 간략히 소개 드리겠습니다.
```

**타임스탬프 계산 로직:**
```python
def generate_srt(slides: list[dict]) -> str:
    """
    slides: [{"slide_no": 1, "script": "...", "delay": 1.5, "duration": 36.5}, ...]
    """
    srt_lines = []
    current_time = 0.0

    for i, slide in enumerate(slides, 1):
        start = current_time + slide["delay"]          # 딜레이 후 자막 시작
        end   = current_time + slide["delay"] + slide["duration"]
        current_time += slide["delay"] + slide["duration"]

        start_ts = format_srt_time(start)
        end_ts   = format_srt_time(end)

        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_ts} --> {end_ts}")
        srt_lines.append(slide["script"].replace("\n", " "))
        srt_lines.append("")

    return "\n".join(srt_lines)


def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
```

**다국어 SRT 생성:**
```python
async def generate_multilang_srt(slides, target_langs=["en", "ja", "zh"]):
    results = {"ko": generate_srt(slides)}  # 원본 한국어

    for lang in target_langs:
        translated_slides = []
        for slide in slides:
            translated = await translate_text(slide["script"], target=lang)
            translated_slides.append({**slide, "script": translated})
        results[lang] = generate_srt(translated_slides)

    return results
```

---

### 2-2. YouTube 챕터 (Chapter Markers)

슬라이드 제목 기반으로 영상 챕터를 자동 생성.
영상 설명란에 삽입하면 YouTube가 자동 인식.

**챕터 형식 (영상 설명에 삽입):**
```
00:00 인트로 - 모바일 WEB 대출 서비스 구축
00:38 목차
01:12 I. 제안업체 소개
01:20 1. 일반 현황
02:57 2. 주요 사업 내용
03:58 3. 사업 실적
...
```

**챕터 생성 코드:**
```python
def generate_chapters(slides: list[dict]) -> str:
    chapters = []
    current_time = 0.0

    for slide in slides:
        ts = format_chapter_time(current_time)
        title = slide.get("slide_title", f"슬라이드 {slide['slide_no']}")
        chapters.append(f"{ts} {title}")
        current_time += slide["delay"] + slide["duration"]

    return "\n".join(chapters)


def format_chapter_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}" if m < 60 else f"{int(m//60)}:{m%60:02d}:{s:02d}"
```

---

### 2-3. YouTube 메타데이터 자동 생성

**youtube_metadata.json:**
```json
{
  "title": {
    "ko": "BNK 부산은행 모바일 WEB 대출 서비스 구축 제안 발표",
    "en": "BNK Busan Bank Mobile Web Loan Service Development Proposal"
  },
  "description": {
    "ko": "📌 목차\n00:00 인트로\n00:38 목차\n01:12 I. 제안업체 소개\n...\n\n본 영상은 SlideNarrator로 자동 생성되었습니다.",
    "en": "📌 Chapters\n00:00 Intro\n00:38 Table of Contents\n..."
  },
  "tags": ["부산은행", "모바일대출", "제안발표", "IT서비스", "핀테크"],
  "category_id": "27",
  "default_language": "ko",
  "privacy_status": "private"
}
```

**메타데이터 자동 생성 코드:**
```python
async def generate_youtube_metadata(slides, chapters_text):
    # 전체 스크립트에서 키워드 추출
    full_script = " ".join(s["script"] for s in slides)

    # 제목: 첫 슬라이드 제목 또는 PPTX 파일명 기반
    title_ko = slides[0].get("slide_title", "발표 영상")
    title_en = await translate_text(title_ko, target="en")

    # 설명: 챕터 + 자동 생성 문구
    desc_ko = f"📌 목차\n{chapters_text}\n\n🎙️ SlideNarrator로 자동 생성된 영상입니다."
    desc_en = await translate_text(desc_ko, target="en")

    # 태그: 슬라이드 제목에서 명사 추출 (간단 버전)
    tags = list(set([s.get("slide_title", "") for s in slides if s.get("slide_title")]))[:10]

    return {
        "title": {"ko": title_ko, "en": title_en},
        "description": {"ko": desc_ko, "en": desc_en},
        "tags": tags,
        "chapters": chapters_text
    }
```

---

### 2-4. 썸네일 자동 추출

첫 번째 슬라이드 이미지를 YouTube 썸네일(1280×720)로 변환.

```python
from PIL import Image

def generate_thumbnail(slide_image_path: str, output_path: str):
    img = Image.open(slide_image_path)
    # YouTube 권장 썸네일: 1280×720 (16:9)
    img_resized = img.resize((1280, 720), Image.LANCZOS)
    img_resized.save(output_path, "JPEG", quality=95)
```

---

## 3. YouTube Data API v3 자동 업로드

### 설정 (최초 1회)

1. Google Cloud Console → 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 2.0 사용자 인증 정보 생성
4. `credentials.json` 다운로드

```bash
pip install google-api-python-client google-auth-oauthlib
```

### 업로드 코드

```python
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube.force-ssl"]


def get_youtube_client(credentials_path: str):
    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
    creds = flow.run_local_server(port=0)
    return build("youtube", "v3", credentials=creds)


def upload_video(youtube, video_path: str, metadata: dict) -> str:
    body = {
        "snippet": {
            "title":       metadata["title"]["ko"],
            "description": metadata["description"]["ko"],
            "tags":        metadata["tags"],
            "categoryId":  "27",               # 교육
            "defaultLanguage": "ko",
        },
        "status": {
            "privacyStatus": "private",        # 업로드 후 수동 공개
            "selfDeclaredMadeForKids": False,
        }
    }
    media = MediaFileUpload(video_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"업로드 {int(status.progress() * 100)}%")

    return response["id"]   # video_id


def upload_caption(youtube, video_id: str, srt_path: str, lang: str, name: str):
    body = {
        "snippet": {
            "videoId":  video_id,
            "language": lang,
            "name":     name,
            "isDraft":  False,
        }
    }
    media = MediaFileUpload(srt_path, mimetype="application/octet-stream")
    youtube.captions().insert(part="snippet", body=body, media_body=media).execute()


def upload_thumbnail(youtube, video_id: str, thumbnail_path: str):
    media = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
    youtube.thumbnails().set(videoId=video_id, media_body=media).execute()


# 전체 업로드 플로우
def upload_to_youtube(youtube, job_result: dict):
    # 1. 영상 업로드
    video_id = upload_video(youtube, job_result["video_path"], job_result["metadata"])
    print(f"영상 업로드 완료: https://youtu.be/{video_id}")

    # 2. 자막 업로드 (다국어)
    for lang, srt_path in job_result["srt_files"].items():
        lang_name = {"ko": "한국어", "en": "English", "ja": "日本語", "zh": "中文"}
        upload_caption(youtube, video_id, srt_path, lang, lang_name.get(lang, lang))
        print(f"자막 업로드: {lang}")

    # 3. 썸네일 업로드
    upload_thumbnail(youtube, video_id, job_result["thumbnail_path"])
    print("썸네일 업로드 완료")

    return f"https://youtu.be/{video_id}"
```

---

## 4. YouTube 자동 번역 활성화 원리

```
① SRT 자막 업로드 (한국어 원본)
          ↓
② YouTube이 자막을 기반으로 다국어 자동 번역 생성
   (영어, 일본어, 스페인어 등 100개 이상 언어)
          ↓
③ 시청자가 자막 언어 선택 → 해당 언어로 자막 표시

[추가 강화 방법]
- 영어 SRT도 함께 업로드 → 영어권 자동 번역 품질 향상
- 정확한 타임스탬프 = 자동 번역 품질 직결
```

---

## 5. YouTube 최적화 체크리스트

| 항목 | 자동 생성 | 수동 필요 |
|------|---------|---------|
| 영상 제목 (한/영) | ✅ | 검토 후 수정 |
| 영상 설명 + 챕터 | ✅ | 검토 후 수정 |
| 태그 | ✅ | 추가 가능 |
| 한국어 SRT 자막 | ✅ | - |
| 영어 SRT 자막 | ✅ | - |
| 다국어 SRT (일/중) | ✅ | - |
| 썸네일 (첫 슬라이드) | ✅ | 커스텀 썸네일 교체 가능 |
| 카테고리 | 교육(27) 자동 | 변경 가능 |
| 공개 설정 | 비공개 자동 | 검토 후 공개 전환 |

---

## 6. API 엔드포인트 추가

### POST /jobs/{job_id}/youtube

YouTube 업로드 및 메타데이터 패키지 생성

**Request**
```json
{
  "target_langs": ["ko", "en", "ja"],
  "auto_upload": false,
  "youtube_credentials": "base64_encoded_credentials_json"
}
```

**Response 200**
```json
{
  "job_id": "550e8400-...",
  "youtube_package": {
    "video_path": "s3://bucket/output/video.mp4",
    "thumbnail_path": "s3://bucket/output/thumbnail.jpg",
    "srt_files": {
      "ko": "s3://bucket/output/subtitle_ko.srt",
      "en": "s3://bucket/output/subtitle_en.srt",
      "ja": "s3://bucket/output/subtitle_ja.srt"
    },
    "metadata": {
      "title": {"ko": "...", "en": "..."},
      "description": {"ko": "...", "en": "..."},
      "tags": ["태그1", "태그2"],
      "chapters": "00:00 인트로\n00:38 목차\n..."
    }
  },
  "youtube_url": null
}
```

### GET /jobs/{job_id}/youtube/download

YouTube 패키지 ZIP 다운로드
- `video.mp4`
- `subtitle_ko.srt`, `subtitle_en.srt`, ...
- `thumbnail.jpg`
- `youtube_metadata.json`
- `upload_guide.txt`

---

## 7. YouTube 패키지 구성 (다운로드 시)

```
slidenarrator_youtube_package.zip
├── video.mp4                  ← 영상 본체
├── thumbnail.jpg              ← 썸네일 (1280×720)
├── subtitles/
│   ├── subtitle_ko.srt        ← 한국어 자막
│   ├── subtitle_en.srt        ← 영어 자막
│   ├── subtitle_ja.srt        ← 일본어 자막
│   └── subtitle_zh.srt        ← 중국어 자막
├── youtube_metadata.json      ← 제목/설명/태그 (복붙용)
└── upload_guide.txt           ← YouTube 업로드 순서 안내
```

**upload_guide.txt 내용:**
```
[YouTube 업로드 순서]
1. video.mp4 업로드
2. 제목: youtube_metadata.json의 title.ko 복붙
3. 설명: youtube_metadata.json의 description.ko 복붙
   (챕터 포함 → YouTube가 자동 인식)
4. 태그: youtube_metadata.json의 tags 복붙
5. 자막 업로드: 자막 → 자막 추가 → 파일 업로드
   - subtitle_ko.srt (언어: 한국어)
   - subtitle_en.srt (언어: 영어)
   - subtitle_ja.srt (언어: 일본어)
6. 썸네일: thumbnail.jpg 업로드
7. 공개 설정 후 게시
```

---

## 8. 추가 라이브러리

```
google-api-python-client==2.118.0
google-auth-oauthlib==1.2.0
Pillow==10.2.0          # 썸네일 생성
```
