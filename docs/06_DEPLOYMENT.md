# 06. 배포 가이드

---

## 1. 로컬 개발 환경

### 사전 요구사항

```bash
# 시스템 도구
brew install ffmpeg libreoffice python@3.11

# Python 의존성
pip install -r requirements.txt

# Redis (로컬)
brew install redis && brew services start redis
```

### 실행

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 2. DB 마이그레이션
alembic upgrade head

# 3. FastAPI 서버 실행
uvicorn src.main:app --reload --port 8000

# 4. Celery Worker 실행 (별도 터미널)
celery -A src.worker.celery_app worker --loglevel=info --concurrency=4

# 5. 접속
open http://localhost:8000
```

---

## 2. Docker 구성

### docker-compose.yml

```yaml
version: "3.9"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - redis
      - db
    volumes:
      - ./tmp:/app/tmp

  worker:
    build: .
    command: celery -A src.worker.celery_app worker --loglevel=info --concurrency=4
    env_file: .env
    depends_on:
      - redis
      - db
    volumes:
      - ./tmp:/app/tmp

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: slidenarrator
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

# 시스템 의존성
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libreoffice \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 실행

```bash
docker-compose up --build
```

---

## 3. AWS 배포

### 아키텍처

```
Route53 → CloudFront → ALB → EC2 (API)
                              ↓
                        EC2 (Worker) × N
                              ↓
                        ElastiCache (Redis)
                        RDS (PostgreSQL)
                        S3 (결과 파일)
```

### EC2 인스턴스 스펙 (권장)

| 역할 | 인스턴스 | 스펙 | 월 비용 |
|------|---------|------|--------|
| API 서버 | t3.medium | 2 vCPU, 4GB | ~$30 |
| Worker | c5.large | 2 vCPU, 4GB | ~$70 |
| Redis | t3.micro (ElastiCache) | 1GB | ~$15 |
| DB | db.t3.micro (RDS) | 1 vCPU, 1GB | ~$25 |
| S3 | - | 종량제 | ~$5 |
| **합계** | | | **~$145/월** |

### 배포 순서

```bash
# 1. EC2 인스턴스 생성 (Ubuntu 22.04)
# 2. Docker 설치
sudo apt install docker.io docker-compose -y

# 3. 코드 배포
git clone https://github.com/your-org/slidenarrator.git
cd slidenarrator

# 4. 환경 변수 설정
cp .env.example .env
nano .env  # AWS 설정 입력

# 5. 실행
docker-compose -f docker-compose.prod.yml up -d

# 6. Nginx 리버스 프록시 설정
sudo apt install nginx -y
# /etc/nginx/sites-available/slidenarrator 작성
```

### Nginx 설정

```nginx
server {
    listen 80;
    server_name slidenarrator.com www.slidenarrator.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name slidenarrator.com;

    ssl_certificate /etc/letsencrypt/live/slidenarrator.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/slidenarrator.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
}
```

---

## 4. 도메인 & SSL

```bash
# Let's Encrypt SSL 인증서 (무료)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d slidenarrator.com -d www.slidenarrator.com

# 자동 갱신 확인
sudo certbot renew --dry-run
```

---

## 5. 모니터링

### Sentry (에러 추적)

```python
# src/main.py
import sentry_sdk
sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.1)
```

### 헬스체크 엔드포인트

```
GET /health
→ {"status": "ok", "db": "ok", "redis": "ok", "worker_count": 2}
```

### 알림 설정

| 조건 | 알림 채널 |
|------|---------|
| 에러율 > 5% | Slack |
| Worker 중단 | Slack + 이메일 |
| 디스크 사용률 > 80% | 이메일 |
| API 응답 > 3초 | Slack |

---

## 6. 서비스 등록

### 도메인 등록

| 항목 | 내용 |
|------|------|
| 도메인 | slidenarrator.com (가비아/후이즈) |
| 연간 비용 | ~₩15,000/년 |

### 사업자 등록 (유료화 시)

| 항목 | 내용 |
|------|------|
| 업종 | 정보통신업 (소프트웨어 개발) |
| 통신판매업 신고 | 유료 서비스 시 필수 |
| 개인정보처리방침 | 웹사이트 게시 필수 |
| 이용약관 | 웹사이트 게시 필수 |

### 앱스토어 등록 (향후)

| 플랫폼 | 조건 | 비용 |
|--------|------|------|
| Chrome 확장 | 개발자 계정 | $5 1회 |
| MS Teams 앱 | 파트너 등록 | 무료 |
| Slack 앱 | 앱 디렉토리 | 무료 |

### 결제 연동

```
토스페이먼츠 (한국)
  - 가입: business.tosspayments.com
  - 수수료: 카드 2.2%, 계좌이체 0.7%

Stripe (글로벌)
  - 가입: stripe.com
  - 수수료: 2.9% + $0.30
```

---

## 7. CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: pytest tests/
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd /app/slidenarrator
            git pull
            docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 8. requirements.txt

```
fastapi==0.110.0
uvicorn[standard]==0.27.0
celery==5.3.6
redis==5.0.1
sqlalchemy==2.0.27
asyncpg==0.29.0
alembic==1.13.1
python-pptx==0.6.23
PyMuPDF==1.23.26
edge-tts==6.1.10
openai==1.12.0
deep-translator==1.11.4
ffmpeg-python==0.2.0
python-srt==3.5.3
boto3==1.34.0
python-multipart==0.0.9
pydantic-settings==2.2.0
sentry-sdk[fastapi]==1.40.0
pytest==8.0.0
pytest-asyncio==0.23.5
httpx==0.27.0
```
