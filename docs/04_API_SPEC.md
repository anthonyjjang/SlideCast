# 04. API 명세

Base URL: `https://api.slidenarrator.com/v1`

---

## 1. 파일 업로드

### POST /jobs

PPTX 파일을 업로드하고 영상 생성 작업을 시작합니다.

**Request**
```
Content-Type: multipart/form-data

file         : PPTX 파일 (필수)
voice_id     : 목소리 ID (기본값: ko_male_hyunsu)
slide_delay  : 화면 전환 딜레이 초 (기본값: 1.5)
resolution   : 720p | 1080p (기본값: 1080p)
subtitle     : true | false (기본값: false)
target_lang  : ko | en | ja | zh | es (기본값: 원본 언어)
```

**Response 200**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "slide_count": 30,
  "slides": [
    {
      "slide_no": 1,
      "script": "안녕하십니까, 지금부터 발표를 시작하겠습니다.",
      "has_script": true
    }
  ],
  "created_at": "2026-05-07T09:00:00Z"
}
```

**Response 400**
```json
{
  "error": "INVALID_FILE_TYPE",
  "message": "PPTX 파일만 업로드 가능합니다."
}
```

---

## 2. 스크립트 수정 후 생성 시작

### PATCH /jobs/{job_id}/scripts

슬라이드 스크립트를 수정하고 영상 생성을 시작합니다.

**Request**
```json
{
  "slides": [
    { "slide_no": 1, "script": "수정된 스크립트 내용" },
    { "slide_no": 3, "script": "세 번째 슬라이드 내용" }
  ],
  "start": true
}
```

**Response 200**
```json
{
  "job_id": "550e8400-...",
  "status": "processing",
  "message": "영상 생성을 시작했습니다."
}
```

---

## 3. 작업 상태 조회

### GET /jobs/{job_id}

**Response 200**
```json
{
  "job_id": "550e8400-...",
  "status": "processing",
  "progress": 60,
  "current_slide": 18,
  "total_slides": 30,
  "estimated_remaining_sec": 120,
  "slides": [
    {
      "slide_no": 1,
      "status": "done",
      "duration": 36.5
    },
    {
      "slide_no": 18,
      "status": "processing"
    }
  ]
}
```

**status 값**

| 값 | 설명 |
|----|------|
| pending | 대기 중 |
| processing | 처리 중 |
| done | 완료 |
| failed | 실패 |
| cancelled | 취소됨 |

---

## 4. 실시간 진행 상황 (WebSocket)

### WS /ws/jobs/{job_id}

```json
// 서버 → 클라이언트 메시지
{
  "type": "progress",
  "progress": 60,
  "current_slide": 18,
  "total_slides": 30,
  "message": "슬라이드 18 음성 생성 중..."
}

{
  "type": "completed",
  "output_url": "https://cdn.slidenarrator.com/outputs/xxx.mp4",
  "expires_at": "2026-05-08T09:00:00Z"
}

{
  "type": "error",
  "error": "TTS_FAILED",
  "slide_no": 5,
  "message": "슬라이드 5 음성 생성에 실패했습니다."
}
```

---

## 5. 다운로드

### GET /jobs/{job_id}/download

**Response 302** → S3 Presigned URL로 리다이렉트

---

## 6. 특정 슬라이드 재생성

### POST /jobs/{job_id}/slides/{slide_no}/regenerate

**Request**
```json
{
  "script": "수정된 스크립트",
  "voice_id": "ko_male_injoon"
}
```

**Response 200**
```json
{
  "slide_no": 5,
  "status": "processing",
  "message": "슬라이드 5 재생성을 시작했습니다."
}
```

---

## 7. 목소리 목록 조회

### GET /voices

**Query Parameters**
```
lang  : ko | en | ja | zh (선택)
gender: male | female (선택)
```

**Response 200**
```json
{
  "voices": [
    {
      "id": "ko_male_hyunsu",
      "name": "Hyunsu",
      "lang": "ko",
      "gender": "male",
      "description": "부드럽고 자연스러운 한국어 남성",
      "sample_url": "https://cdn.slidenarrator.com/samples/hyunsu.mp3"
    }
  ]
}
```

---

## 8. 번역 미리보기

### POST /translate

스크립트를 번역하여 미리 확인합니다.

**Request**
```json
{
  "text": "안녕하십니까, 발표를 시작하겠습니다.",
  "source_lang": "ko",
  "target_lang": "en"
}
```

**Response 200**
```json
{
  "original": "안녕하십니까, 발표를 시작하겠습니다.",
  "translated": "Good morning, let me begin the presentation.",
  "source_lang": "ko",
  "target_lang": "en"
}
```

---

## 9. 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_FILE_TYPE | 400 | 지원하지 않는 파일 형식 |
| FILE_TOO_LARGE | 400 | 파일 크기 초과 (100MB) |
| SLIDE_LIMIT_EXCEEDED | 400 | 슬라이드 수 초과 (100장) |
| JOB_NOT_FOUND | 404 | 작업 없음 |
| JOB_EXPIRED | 410 | 작업 만료 (24시간) |
| TTS_FAILED | 500 | 음성 생성 실패 |
| VIDEO_COMPOSE_FAILED | 500 | 영상 합성 실패 |
| QUOTA_EXCEEDED | 429 | 무료 플랜 한도 초과 |
