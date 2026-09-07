// SlideCast 사용자 매뉴얼 덱 생성기 (pptxgenjs)
//
//   npm install pptxgenjs        # 최초 1회
//   node scripts/make_user_manual.js docs/guide/SlideCast_사용자매뉴얼.pptx
//
// 각 슬라이드에 나레이션 노트(첫 줄 = 키메시지)가 들어 있어, 생성된 파일을
// 그대로 SlideCast에 업로드하면 매뉴얼 영상이 만들어진다.
const pptxgen = require("pptxgenjs");
const out = process.argv[2] || "SlideCast_사용자매뉴얼.pptx";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "SlideCast 사용자 매뉴얼";

const F = "Apple SD Gothic Neo";
const MONO = "Courier New";
const C = {
  ink: "1E1B4B", primary: "4F46E5", coral: "E8503F", tint: "EEF0FB", tint2: "DFE3F7",
  white: "FFFFFF", text: "1F2937", muted: "6B7280", green: "16A34A", red: "DC2626",
  amber: "D97706", amberTint: "FEF3C7", greenTint: "DCFCE7", redTint: "FEE2E2",
  code: "111827", codeText: "E5E7EB", codeAccent: "86EFAC", codeMuted: "9CA3AF",
  line: "D1D5DB", appBg: "0F172A", appCard: "1E293B", appBorder: "334155", appMuted: "94A3B8",
};
const W = 13.333, H = 7.5, M = 0.6;
const TOTAL = 18;
let pageNo = 0;

// ---------- helpers ----------
function T(s, text, x, y, w, h, o = {}) {
  s.addText(text, Object.assign({
    x, y, w, h, fontFace: F, fontSize: 14, color: C.text, margin: 0, isTextBox: true, valign: "top",
  }, o));
}
function R(s, x, y, w, h, fill, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({
    x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 }, rectRadius: 0.1,
  }, o));
}
function Rect(s, x, y, w, h, fill, o = {}) {
  s.addShape(pres.shapes.RECTANGLE, Object.assign({
    x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 },
  }, o));
}
function circle(s, x, y, d, fill, label, o = {}) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 } });
  if (label !== undefined) {
    T(s, String(label), x, y, d, d, Object.assign({
      align: "center", valign: "middle", bold: true, color: C.white, fontSize: 14,
    }, o));
  }
}
function code(s, lines, x, y, w, h, o = {}) {
  R(s, x, y, w, h, C.code, { rectRadius: 0.06 });
  const runs = lines.map((l, i) => {
    const isComment = typeof l === "string" && l.startsWith("#");
    const isOut = typeof l === "string" && l.startsWith(">");
    return {
      text: l, options: {
        breakLine: i < lines.length - 1,
        color: isComment ? C.codeMuted : (isOut ? C.codeAccent : C.codeText),
      },
    };
  });
  s.addText(runs, Object.assign({
    x: x + 0.18, y: y + 0.12, w: w - 0.36, h: h - 0.24, fontFace: MONO, fontSize: 11.5,
    margin: 0, isTextBox: true, valign: "top", paraSpaceAfter: 2,
  }, o));
}
function header(s, section, title) {
  pageNo += 1;
  s.background = { color: C.white };
  T(s, section, M, 0.42, 8, 0.3, { fontSize: 11, bold: true, color: C.primary, charSpacing: 2 });
  T(s, title, M, 0.72, W - 2 * M, 0.6, { fontSize: 26, bold: true, color: C.ink });
  T(s, "SlideCast 사용자 매뉴얼 · v1.0", M, 7.05, 5, 0.25, { fontSize: 9.5, color: C.muted });
  T(s, `${pageNo} / ${TOTAL}`, W - M - 1.2, 7.05, 1.2, 0.25, { fontSize: 9.5, color: C.muted, align: "right" });
}
function bullets(s, items, x, y, w, h, o = {}) {
  const runs = items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } }));
  s.addText(runs, Object.assign({
    x, y, w, h, fontFace: F, fontSize: 13, color: C.text, margin: 0, isTextBox: true, valign: "top", paraSpaceAfter: 6,
  }, o));
}
// 카드 + 제목 + 본문
function infoCard(s, x, y, w, h, title, body, opt = {}) {
  R(s, x, y, w, h, opt.fill || C.tint);
  const pad = 0.22;
  let ty = y + pad;
  if (opt.badge !== undefined) {
    circle(s, x + pad, y + pad, 0.42, opt.badgeColor || C.primary, opt.badge, { fontSize: 13 });
    T(s, title, x + pad + 0.55, y + pad, w - pad * 2 - 0.55, 0.42, { fontSize: 14.5, bold: true, color: C.ink, valign: "middle" });
    ty = y + pad + 0.55;
  } else {
    T(s, title, x + pad, ty, w - pad * 2, 0.35, { fontSize: 14.5, bold: true, color: opt.titleColor || C.ink });
    ty += 0.4;
  }
  T(s, body, x + pad, ty, w - pad * 2, y + h - ty - pad, { fontSize: opt.bodySize || 12.5, color: C.text, paraSpaceAfter: 4 });
}
function note(s, text, x, y, w, h, kind = "info") {
  const map = { info: [C.tint2, C.primary, "i"], warn: [C.amberTint, C.amber, "!"], ok: [C.greenTint, C.green, "✓"] };
  const [fill, dot, glyph] = map[kind];
  R(s, x, y, w, h, fill);
  circle(s, x + 0.18, y + (h - 0.36) / 2, 0.36, dot, glyph, { fontSize: 12 });
  T(s, text, x + 0.7, y, w - 0.9, h, { fontSize: 12.5, valign: "middle", color: C.text });
}
function table(s, rows, x, y, w, colW, o = {}) {
  const head = rows[0].map(t => ({
    text: t, options: { bold: true, color: C.white, fill: { color: C.ink }, fontFace: F, fontSize: o.headSize || 12, valign: "middle" },
  }));
  const body = rows.slice(1).map((r, ri) => r.map((t, ci) => ({
    text: t, options: {
      fontFace: (o.monoCols || []).includes(ci) ? MONO : F,
      fontSize: o.fontSize || 11.5, color: C.text, valign: "middle",
      bold: (o.boldCols || []).includes(ci),
      fill: { color: ri % 2 === 0 ? C.white : "F5F6FB" },
    },
  })));
  s.addTable([head, ...body], Object.assign({
    x, y, w, colW, border: { type: "solid", pt: 0.5, color: C.line }, margin: 0.07, autoPage: false,
    rowH: o.rowH,
  }, o.extra || {}));
}
function notes(s, key, body) { s.addNotes(`키메시지: ${key}\n${body}`); }

// =====================================================================
// 1. 표지
// =====================================================================
{
  const s = pres.addSlide();
  pageNo += 1;
  s.background = { color: C.ink };
  T(s, "SLIDECAST · USER MANUAL", M, 1.5, 7, 0.35, { fontSize: 12, bold: true, color: C.coral, charSpacing: 3 });
  T(s, "SlideCast\n사용자 매뉴얼", M, 1.95, 7, 2.2, { fontSize: 48, bold: true, color: C.white, lineSpacingMultiple: 1.05 });
  T(s, "발표자료(PPTX) 한 개로 AI 나레이션 영상과 자막을 만드는\n설치 · 작성 · 업로드 · 결과 수령 · 문제 해결 전 과정 안내", M, 4.35, 7.2, 0.9,
    { fontSize: 15, color: "C7C9E8", lineSpacingMultiple: 1.3 });
  T(s, "버전 1.0 (MVP)  ·  2026년 9월  ·  로컬 실행 환경(macOS) 기준", M, 6.6, 8, 0.3, { fontSize: 11, color: "8B8DB8" });

  // 오른쪽 입력→출력 그래픽
  const gx = 8.6, gy = 2.0;
  R(s, gx, gy, 2.1, 1.5, C.primary, { rectRadius: 0.12 });
  T(s, ".pptx", gx, gy + 0.25, 2.1, 0.55, { fontSize: 24, bold: true, color: C.white, align: "center" });
  T(s, "슬라이드 노트 = 대본", gx, gy + 0.85, 2.1, 0.4, { fontSize: 11, color: "DDE0FF", align: "center" });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: gx + 2.25, y: gy + 0.45, w: 0.7, h: 0.6, fill: { color: C.coral }, line: { color: C.coral, width: 0 } });
  R(s, gx + 3.1, gy - 0.35, 1.7, 1.0, "2B2866", { rectRadius: 0.1 });
  T(s, "MP4", gx + 3.1, gy - 0.3, 1.7, 0.5, { fontSize: 20, bold: true, color: C.white, align: "center" });
  T(s, "1920×1080 영상", gx + 3.1, gy + 0.2, 1.7, 0.35, { fontSize: 10.5, color: "C7C9E8", align: "center" });
  R(s, gx + 3.1, gy + 0.85, 1.7, 1.0, "2B2866", { rectRadius: 0.1 });
  T(s, "SRT", gx + 3.1, gy + 0.9, 1.7, 0.5, { fontSize: 20, bold: true, color: C.white, align: "center" });
  T(s, "YouTube 자막", gx + 3.1, gy + 1.4, 1.7, 0.35, { fontSize: 10.5, color: "C7C9E8", align: "center" });
  T(s, "노트 → 음성 → 영상  자동 변환", gx, gy + 2.3, 4.8, 0.4, { fontSize: 12, color: "8B8DB8", align: "center", italic: true });
  notes(s, "표지", "안녕하세요. 슬라이드캐스트 사용자 매뉴얼입니다. 이 매뉴얼은 프로그램 설치부터 발표자료 작성, 업로드, 결과물 수령, 문제 해결까지 사용자가 알아야 할 전 과정을 순서대로 안내합니다.");
}

// =====================================================================
// 2. 목차
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "CONTENTS", "이 매뉴얼의 구성");
  const toc = [
    ["SlideCast 소개", "무엇을 입력하고 무엇이 나오는가"],
    ["설치와 실행", "최초 1회 설치, 매번 실행하는 터미널 3개"],
    ["발표자료 준비", "노트 작성 규칙과 제약사항, 대본 작성 팁"],
    ["업로드와 설정", "업로드 화면, 목소리와 전환 여백"],
    ["진행 상황 확인", "진행률 단계별 의미와 소요 시간"],
    ["결과물 받기", "MP4 다운로드, SRT 위치, 산출물 규격, YouTube 업로드"],
    ["문제 해결", "오류 메시지별 원인과 조치, 자주 묻는 증상"],
    ["부록", "API로 사용하기, 업로드 전 체크리스트"],
  ];
  toc.forEach((t, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = M + col * 6.2, y = 1.7 + row * 1.2;
    circle(s, x, y + 0.05, 0.5, C.primary, i + 1, { fontSize: 15 });
    T(s, t[0], x + 0.7, y, 5.3, 0.4, { fontSize: 17, bold: true, color: C.ink });
    T(s, t[1], x + 0.7, y + 0.42, 5.3, 0.5, { fontSize: 12, color: C.muted });
  });
  note(s, "기준: MVP 버전(2026-09), macOS에서 로컬 서버를 직접 실행하는 환경. 웹 화면의 제품명은 코드명인 'SlideNarrator'로 표시됩니다.", M, 6.35, W - 2 * M, 0.55, "info");
  notes(s, "목차", "매뉴얼은 여덟 부분으로 구성됩니다. 소개, 설치와 실행, 발표자료 준비, 업로드와 설정, 진행 상황 확인, 결과물 받기, 문제 해결, 그리고 부록 순서입니다.");
}

// =====================================================================
// 3. 소개
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "1 · INTRODUCTION", "SlideCast는 무엇을 하나요");
  T(s, "PowerPoint 파일의 슬라이드 노트를 발표 대본으로 읽어 AI 음성을 만들고, 슬라이드 이미지와 합쳐 나레이션 영상을 자동으로 만들어 줍니다. 사용자가 직접 하는 일은 대본을 적는 것뿐이며 나머지는 서버가 처리합니다.",
    M, 1.55, 7.4, 1.0, { fontSize: 13.5, lineSpacingMultiple: 1.25 });

  const steps = [
    ["대본 작성", "각 슬라이드의 노트에\n발표 대본을 입력합니다"],
    ["업로드", "웹 화면에 파일을 끌어다 놓고\n목소리와 여백을 고릅니다"],
    ["결과 수령", "MP4 영상을 내려받고\nSRT 자막을 함께 씁니다"],
  ];
  steps.forEach((st, i) => {
    const x = M + i * 2.55, y = 2.85;
    R(s, x, y, 2.3, 2.3, C.tint);
    circle(s, x + 0.2, y + 0.2, 0.5, i === 0 ? C.coral : C.primary, i + 1, { fontSize: 15 });
    T(s, st[0], x + 0.2, y + 0.85, 1.9, 0.4, { fontSize: 15, bold: true, color: C.ink });
    T(s, st[1], x + 0.2, y + 1.25, 1.95, 0.9, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
    if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.33, y: y + 1.0, w: 0.2, h: 0.3, fill: { color: C.line }, line: { color: C.line, width: 0 } });
  });
  T(s, "1단계만 사람이 하고, 2단계 이후는 전부 자동입니다.", M, 5.35, 7.4, 0.4, { fontSize: 12.5, italic: true, color: C.coral, bold: true });

  // 오른쪽 입력/출력
  const rx = 8.5;
  R(s, rx, 1.55, 4.23, 4.9, C.tint);
  T(s, "입력", rx + 0.3, 1.8, 3.6, 0.35, { fontSize: 12, bold: true, color: C.primary, charSpacing: 1 });
  T(s, "PPTX 파일 1개", rx + 0.3, 2.15, 3.6, 0.4, { fontSize: 17, bold: true, color: C.ink });
  bullets(s, ["슬라이드 노트에 대본 포함", "100MB · 100장 이내", "16:9 비율 권장"], rx + 0.3, 2.6, 3.6, 1.2, { fontSize: 12 });
  Rect(s, rx + 0.3, 3.85, 3.63, 0.02, C.line);
  T(s, "출력", rx + 0.3, 4.0, 3.6, 0.35, { fontSize: 12, bold: true, color: C.primary, charSpacing: 1 });
  T(s, "MP4 영상 + SRT 자막", rx + 0.3, 4.35, 3.6, 0.4, { fontSize: 17, bold: true, color: C.ink });
  bullets(s, ["1920×1080 · 30fps · H.264 / AAC", "슬라이드마다 음성 길이만큼 재생", "자막 타임코드는 영상과 정확히 일치"], rx + 0.3, 4.8, 3.6, 1.5, { fontSize: 12 });
  notes(s, "소개", "슬라이드캐스트는 파워포인트 파일의 슬라이드 노트를 발표 대본으로 읽어 인공지능 음성을 만들고, 슬라이드 이미지와 합쳐서 나레이션 영상을 자동으로 만들어 줍니다. 사용자는 대본만 적으면 됩니다.");
}

// =====================================================================
// 4. 설치 (최초 1회)
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "2 · SETUP", "설치 — 최초 1회만 하면 됩니다");
  R(s, M, 1.55, 5.4, 5.2, C.tint);
  T(s, "시스템 요구사항", M + 0.3, 1.8, 4.8, 0.4, { fontSize: 15, bold: true, color: C.ink });
  const req = [
    ["macOS + Keynote", "슬라이드를 원본 폰트 그대로 이미지로 변환합니다. Keynote가 없으면 LibreOffice로 자동 대체됩니다."],
    ["Python 3.11 이상", "서버와 워커가 Python으로 동작합니다."],
    ["ffmpeg · Redis · LibreOffice", "영상 합성, 작업 큐, 변환 폴백에 각각 필요합니다."],
    ["인터넷 연결", "음성 합성(edge-tts)이 Microsoft 서버를 사용합니다. 오프라인에서는 음성이 생성되지 않습니다."],
  ];
  req.forEach((r, i) => {
    const y = 2.35 + i * 1.05;
    circle(s, M + 0.3, y + 0.02, 0.32, C.primary, "✓", { fontSize: 11 });
    T(s, r[0], M + 0.75, y - 0.02, 4.4, 0.35, { fontSize: 13.5, bold: true, color: C.ink });
    T(s, r[1], M + 0.75, y + 0.33, 4.4, 0.7, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.15 });
  });

  const cx = 6.45, cw = W - M - cx;
  T(s, "터미널에서 순서대로 실행", cx, 1.55, cw, 0.4, { fontSize: 15, bold: true, color: C.ink });
  code(s, [
    "# 1) 외부 프로그램 설치 (Homebrew)",
    "brew install ffmpeg redis libreoffice",
    "",
    "# 2) 프로젝트 폴더로 이동 후 가상환경 생성",
    "cd ~/SlideCast",
    "python3 -m venv .venv",
    "source .venv/bin/activate",
    "",
    "# 3) Python 패키지 설치",
    "pip install -r requirements.txt",
  ], cx, 2.0, cw, 3.15);
  note(s, "Docker를 쓰는 경우 Redis는 brew 대신  docker compose up -d redis  로 띄울 수 있습니다.", cx, 5.35, cw, 0.6, "info");
  note(s, "설치가 끝나면 이후로는 '실행' 단계(다음 장)만 반복하면 됩니다.", cx, 6.1, cw, 0.6, "ok");
  notes(s, "설치", "설치는 최초 한 번만 하면 됩니다. 맥 환경에서 홈브루로 에프에프엠펙, 레디스, 리브레오피스를 설치하고, 파이썬 가상환경을 만든 뒤 패키지를 설치합니다. 음성 합성은 인터넷 연결이 필요하다는 점을 기억해 주세요.");
}

// =====================================================================
// 5. 실행 (매번)
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "2 · RUN", "실행 — 사용할 때마다 터미널 3개를 띄웁니다");
  const cards = [
    ["1", "메시지 브로커", "작업 큐 저장소입니다.\n가장 먼저 실행합니다.", ["redis-server"]],
    ["2", "백그라운드 워커", "영상 변환을 실제로 수행합니다.\n가상환경 활성화가 필요합니다.", ["source .venv/bin/activate", "celery -A src.worker.celery_app \\", "  worker --loglevel=info"]],
    ["3", "웹 서버", "브라우저가 접속하는 화면입니다.\n가상환경 활성화가 필요합니다.", ["source .venv/bin/activate", "uvicorn src.main:app --reload"]],
  ];
  const cw = (W - 2 * M - 0.5) / 3;
  cards.forEach((c, i) => {
    const x = M + i * (cw + 0.25), y = 1.55;
    R(s, x, y, cw, 3.55, C.tint);
    circle(s, x + 0.22, y + 0.22, 0.44, C.primary, c[0], { fontSize: 14 });
    T(s, `터미널 ${c[0]} · ${c[1]}`, x + 0.78, y + 0.22, cw - 1.0, 0.44, { fontSize: 14, bold: true, color: C.ink, valign: "middle" });
    T(s, c[2], x + 0.22, y + 0.8, cw - 0.44, 0.8, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.15 });
    code(s, c[3], x + 0.22, y + 1.7, cw - 0.44, 1.6, { fontSize: 11 });
  });
  // 접속
  R(s, M, 5.3, 6.0, 1.55, C.ink);
  T(s, "접속 주소", M + 0.3, 5.45, 3, 0.3, { fontSize: 11, bold: true, color: "A5B4FC", charSpacing: 1 });
  T(s, "http://localhost:8000", M + 0.3, 5.75, 5.4, 0.5, { fontSize: 22, bold: true, color: C.white, fontFace: MONO });
  T(s, "서버 상태 확인:  http://localhost:8000/health  →  {\"status\": \"ok\"}", M + 0.3, 6.3, 5.5, 0.4, { fontSize: 11, color: "C7C9E8", fontFace: MONO });
  note(s, "워커(터미널 2)를 띄우지 않으면 업로드는 되지만 진행률이 0%에서 멈춥니다. 종료할 때는 각 터미널에서 Ctrl+C를 누릅니다.", 6.85, 5.3, W - M - 6.85, 1.55, "warn");
  notes(s, "실행", "사용할 때마다 터미널 세 개를 띄웁니다. 첫 번째는 레디스 서버, 두 번째는 셀러리 워커, 세 번째는 유비콘 웹서버입니다. 그다음 브라우저에서 로컬호스트 팔천 번 포트로 접속합니다. 워커를 띄우지 않으면 진행률이 영 퍼센트에서 멈추니 주의하세요.");
}

// =====================================================================
// 6. 노트 규칙
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "3 · AUTHORING", "발표자료 준비 ① 노트의 첫 줄은 읽지 않습니다");
  T(s, "SlideCast는 각 슬라이드 노트의 첫 줄을 제목(키메시지)으로 보고 나레이션에서 제외합니다. 실제로 읽힐 대본은 반드시 두 번째 줄부터 적으세요.",
    M, 1.5, W - 2 * M, 0.6, { fontSize: 13.5, lineSpacingMultiple: 1.25 });

  const cw = (W - 2 * M - 0.4) / 2;
  // ✗
  const x1 = M, y = 2.3;
  R(s, x1, y, cw, 3.3, C.redTint);
  T(s, "✗  이렇게 쓰면 무음으로 지나갑니다", x1 + 0.25, y + 0.2, cw - 0.5, 0.4, { fontSize: 15, bold: true, color: C.red });
  R(s, x1 + 0.25, y + 0.7, cw - 0.5, 1.3, C.white, { rectRadius: 0.06 });
  T(s, "[슬라이드 노트]", x1 + 0.45, y + 0.8, cw - 0.9, 0.3, { fontSize: 10.5, color: C.muted, fontFace: MONO });
  T(s, "오늘의 핵심은 자동화입니다.", x1 + 0.45, y + 1.15, cw - 0.9, 0.4, { fontSize: 14, color: C.text });
  T(s, "노트가 한 줄뿐이면 그 한 줄이 '첫 줄'로 간주되어 통째로 제외됩니다. 이 슬라이드는 전환 여백 시간만큼만 소리 없이 표시됩니다.",
    x1 + 0.25, y + 2.15, cw - 0.5, 1.0, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.2 });
  // ✓
  const x2 = M + cw + 0.4;
  R(s, x2, y, cw, 3.3, C.greenTint);
  T(s, "✓  이렇게 써야 정상입니다", x2 + 0.25, y + 0.2, cw - 0.5, 0.4, { fontSize: 15, bold: true, color: C.green });
  R(s, x2 + 0.25, y + 0.7, cw - 0.5, 1.75, C.white, { rectRadius: 0.06 });
  T(s, "[슬라이드 노트]", x2 + 0.45, y + 0.8, cw - 0.9, 0.3, { fontSize: 10.5, color: C.muted, fontFace: MONO });
  s.addText([
    { text: "핵심: 자동화", options: { color: C.muted, strike: true } },
    { text: "   ← 1줄: 제외됨", options: { color: C.muted, fontSize: 10.5 } },
  ], { x: x2 + 0.45, y: y + 1.1, w: cw - 0.9, h: 0.35, fontFace: F, fontSize: 13, margin: 0, isTextBox: true });
  T(s, "오늘의 핵심은 자동화입니다.\n세 단계로 나누어 설명하겠습니다.", x2 + 0.45, y + 1.5, cw - 0.9, 0.85, { fontSize: 14, color: C.text, lineSpacingMultiple: 1.2 });
  T(s, "1줄 = 키메시지(제외)  ·  2줄부터 = 실제 나레이션. 2줄 이후의 문단은 모두 이어서 한 번에 읽힙니다.",
    x2 + 0.25, y + 2.55, cw - 0.5, 0.7, { fontSize: 12, color: C.text, lineSpacingMultiple: 1.2 });

  note(s, "노트를 확인하려면 PowerPoint 하단의 '노트' 버튼, Keynote는 보기 → 발표자 노트 보기를 누르세요. 노트가 없는 슬라이드는 무음 장면으로 처리됩니다.", M, 5.9, W - 2 * M, 0.7, "info");
  notes(s, "노트 규칙", "가장 중요한 규칙입니다. 슬라이드 노트의 첫 줄은 나레이션에서 제외됩니다. 첫 줄은 키메시지 자리로 쓰고, 실제 대본은 두 번째 줄부터 적어야 합니다. 한 줄만 적으면 그 슬라이드는 소리 없이 지나갑니다.");
}

// =====================================================================
// 7. 제약사항
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "3 · AUTHORING", "발표자료 준비 ② 지켜야 할 제약사항");
  const items = [
    ["숨김 슬라이드", "숨긴 슬라이드는 영상과 대본에서 함께 제외됩니다. 안 쓰는 장은 삭제 대신 '슬라이드 숨기기'를 쓰면 원본을 보존할 수 있습니다.", "H"],
    ["용량 · 장수 제한", "파일 100MB, 슬라이드 100장까지 처리합니다. 초과하면 업로드 단계에서 거부되거나 작업이 실패합니다.", "100"],
    ["애니메이션 미반영", "화면 전환과 개체 애니메이션은 무시되고 각 슬라이드의 최종 상태만 캡처됩니다. 단계별로 보여 주려면 슬라이드를 나누세요.", "A"],
    ["16:9 비율 권장", "영상은 1920×1080으로 출력됩니다. 4:3 등 다른 비율은 좌우에 여백(레터박스)이 생깁니다.", "16:9"],
    ["폰트", "Mac에서는 Keynote가 원본 폰트를 보존합니다. Linux 서버에 배포할 때는 한글 폰트를 따로 설치해야 글자가 깨지지 않습니다.", "가"],
    ["이미지 화질", "슬라이드에 넣은 저해상도 이미지는 영상에서도 그대로 뭉개집니다. 가로 1920px 이상 이미지를 권장합니다.", "IMG"],
  ];
  const cols = 3, cw = (W - 2 * M - 0.5) / cols, ch = 2.2;
  items.forEach((it, i) => {
    const x = M + (i % cols) * (cw + 0.25), y = 1.55 + Math.floor(i / cols) * (ch + 0.25);
    R(s, x, y, cw, ch, C.tint);
    circle(s, x + 0.22, y + 0.22, 0.5, C.primary, it[2], { fontSize: it[2].length > 2 ? 9.5 : 13 });
    T(s, it[0], x + 0.85, y + 0.22, cw - 1.05, 0.5, { fontSize: 14.5, bold: true, color: C.ink, valign: "middle" });
    T(s, it[1], x + 0.22, y + 0.9, cw - 0.44, ch - 1.05, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
  });
  T(s, "위 제약을 어기면 오류 없이 결과물이 어색해지는 경우(레터박스, 뭉개진 이미지)가 있으니 업로드 전에 확인하세요.", M, 6.55, W - 2 * M, 0.4, { fontSize: 11.5, color: C.muted });
  notes(s, "제약사항", "그 밖에 지켜야 할 제약입니다. 숨김 슬라이드는 자동으로 제외되고, 파일은 백 메가바이트, 슬라이드는 백 장까지 지원합니다. 애니메이션은 반영되지 않으며, 십육 대 구 비율로 작성해야 여백이 생기지 않습니다.");
}

// =====================================================================
// 8. 대본 작성 팁
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "3 · AUTHORING", "발표자료 준비 ③ 자연스럽게 읽히는 대본 쓰기");
  const tips = [
    ["문장을 짧게 끊기", "TTS는 마침표와 쉼표에서 호흡을 나눕니다. 한 문장은 두 줄 이내, 슬라이드당 2~4문장 단위가 듣기 좋습니다."],
    ["숫자와 단위는 읽는 대로", "'2026년 3분기'처럼 읽기가 애매한 표현은 '이천이십육년 삼분기'로 풀어 쓰면 발음이 정확해집니다."],
    ["영문 약어는 발음 확인", "'API', 'PPTX' 같은 약어는 엔진이 낱자로 읽습니다. 의도한 발음이 아니면 '에이피아이'처럼 한글로 적으세요."],
    ["URL · 기호 제거", "주소, 괄호, 화살표(→), 별표는 그대로 소리로 읽힙니다. 대본에서는 빼고 화면에만 남기세요."],
    ["대본 언어와 목소리 맞추기", "한국어 대본에는 한국어 목소리를, 영어 대본에는 영어 목소리를 고르세요. 섞이면 발음이 부자연스럽습니다."],
  ];
  tips.forEach((t, i) => {
    const y = 1.55 + i * 1.03;
    circle(s, M, y + 0.05, 0.44, i === 0 ? C.coral : C.primary, i + 1, { fontSize: 13 });
    T(s, t[0], M + 0.65, y, 6.6, 0.38, { fontSize: 14, bold: true, color: C.ink });
    T(s, t[1], M + 0.65, y + 0.38, 6.6, 0.6, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.15 });
  });
  // 예시
  const rx = 8.35, rw = W - M - rx;
  R(s, rx, 1.55, rw, 5.0, C.tint);
  T(s, "예시", rx + 0.3, 1.75, rw - 0.6, 0.35, { fontSize: 12, bold: true, color: C.primary, charSpacing: 1 });
  T(s, "고치기 전", rx + 0.3, 2.15, rw - 0.6, 0.3, { fontSize: 11.5, bold: true, color: C.red });
  R(s, rx + 0.3, 2.45, rw - 0.6, 1.4, C.white, { rectRadius: 0.06 });
  T(s, "Q3 매출 분석\n2026 Q3 매출은 YoY +18% (자세한 내용은 https://example.com 참고) → 4Q 전망 긍정적", rx + 0.45, 2.55, rw - 0.9, 1.25, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
  T(s, "고친 후", rx + 0.3, 4.0, rw - 0.6, 0.3, { fontSize: 11.5, bold: true, color: C.green });
  R(s, rx + 0.3, 4.3, rw - 0.6, 2.0, C.white, { rectRadius: 0.06 });
  T(s, "키메시지: 삼분기 매출 분석\n이천이십육년 삼분기 매출은 전년 같은 기간보다 십팔 퍼센트 늘었습니다. 자세한 수치는 화면의 링크를 참고해 주세요. 사분기 전망도 긍정적입니다.", rx + 0.45, 4.4, rw - 0.9, 1.85, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
  notes(s, "대본 작성 팁", "자연스럽게 읽히는 대본을 쓰는 요령입니다. 문장은 짧게 끊고, 숫자와 단위는 읽는 대로 풀어 쓰고, 영문 약어는 발음을 확인하세요. 주소와 기호는 그대로 소리로 읽히니 대본에서는 빼는 것이 좋습니다.");
}

// =====================================================================
// 9. 업로드 화면
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "4 · UPLOAD", "업로드 화면 — 파일을 놓고 두 가지만 고릅니다");
  // 앱 화면 목업
  const ax = M, ay = 1.55, aw = 6.6, ah = 5.1;
  R(s, ax, ay, aw, ah, C.appBg, { rectRadius: 0.12 });
  T(s, "SlideNarrator ✨", ax, ay + 0.3, aw, 0.5, { fontSize: 22, bold: true, color: C.white, align: "center" });
  T(s, "PPTX 파일 하나로 AI 음성 나레이션 영상을 자동 생성합니다.", ax, ay + 0.8, aw, 0.3, { fontSize: 10, color: C.appMuted, align: "center" });
  // 업로드 영역
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ax + 0.5, y: ay + 1.3, w: aw - 1.0, h: 1.9, fill: { color: C.appCard }, line: { color: "475569", width: 1.5, dashType: "dash" }, rectRadius: 0.1 });
  T(s, "⬆", ax + 0.5, ay + 1.45, aw - 1.0, 0.5, { fontSize: 22, color: "3B82F6", align: "center" });
  T(s, "PPTX 파일을 드래그하여 놓거나 클릭하여 업로드하세요", ax + 0.5, ay + 2.0, aw - 1.0, 0.4, { fontSize: 12, bold: true, color: C.white, align: "center" });
  T(s, "슬라이드 노트가 발표 대본으로 자동 변환됩니다.", ax + 0.5, ay + 2.4, aw - 1.0, 0.3, { fontSize: 9.5, color: C.appMuted, align: "center" });
  // 설정
  const sw = (aw - 1.0 - 0.3) / 2;
  T(s, "목소리 선택", ax + 0.5, ay + 3.45, sw, 0.3, { fontSize: 10, color: C.appMuted });
  R(s, ax + 0.5, ay + 3.75, sw, 0.5, C.appCard, { rectRadius: 0.06, line: { color: C.appBorder, width: 1 } });
  T(s, "한국어 - 여성 (SunHi)   ▾", ax + 0.65, ay + 3.75, sw - 0.3, 0.5, { fontSize: 10.5, color: C.white, valign: "middle" });
  T(s, "화면 전환 여백 (초)", ax + 0.8 + sw, ay + 3.45, sw, 0.3, { fontSize: 10, color: C.appMuted });
  R(s, ax + 0.8 + sw, ay + 3.75, sw, 0.5, C.appCard, { rectRadius: 0.06, line: { color: C.appBorder, width: 1 } });
  T(s, "1.5", ax + 0.95 + sw, ay + 3.75, sw - 0.3, 0.5, { fontSize: 10.5, color: C.white, valign: "middle" });
  // 콜아웃 번호
  circle(s, ax + aw - 0.85, ay + 1.15, 0.42, C.coral, "1", { fontSize: 13 });
  circle(s, ax + 0.2, ay + 3.55, 0.42, C.coral, "2", { fontSize: 13 });
  circle(s, ax + 0.5 + sw, ay + 3.55, 0.42, C.coral, "3", { fontSize: 13 });

  // 설명
  const rx = 7.6, rw = W - M - rx;
  const ex = [
    ["업로드 영역", "PPTX 파일을 끌어다 놓거나 클릭해 파일을 고릅니다. 파일을 놓는 즉시 업로드가 시작되므로 목소리와 여백은 파일을 놓기 전에 먼저 선택하세요."],
    ["목소리 선택", "나레이션 음성입니다. 한국어 남·여, 영어 남·여 4종을 화면에서 고를 수 있습니다. 전체 목록은 다음 장을 참고하세요."],
    ["화면 전환 여백", "슬라이드가 바뀐 뒤 나레이션이 시작될 때까지의 정적 시간(초)입니다. 기본값 1.5초, 0~10초 사이로 지정합니다."],
  ];
  ex.forEach((e, i) => {
    const y = 1.55 + i * 1.55;
    circle(s, rx, y + 0.02, 0.42, C.coral, i + 1, { fontSize: 13 });
    T(s, e[0], rx + 0.6, y, rw - 0.6, 0.4, { fontSize: 15, bold: true, color: C.ink });
    T(s, e[1], rx + 0.6, y + 0.42, rw - 0.6, 1.1, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
  });
  note(s, "파일을 놓으면 설정 영역이 사라지고 진행률 화면으로 바뀝니다. 설정을 바꾸려면 새로고침 후 다시 올리세요.", rx, 6.2, rw, 0.6, "warn");
  notes(s, "업로드 화면", "업로드 화면은 아주 단순합니다. 파일을 끌어다 놓는 영역과, 목소리 선택, 화면 전환 여백 두 가지 설정뿐입니다. 파일을 놓는 즉시 업로드가 시작되므로 설정은 파일을 놓기 전에 먼저 고르세요.");
}

// =====================================================================
// 10. 설정 옵션
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "4 · OPTIONS", "설정 옵션 — 목소리와 화면 전환 여백");
  T(s, "지원 목소리 (Microsoft edge-tts)", M, 1.5, 7.5, 0.4, { fontSize: 15, bold: true, color: C.ink });
  table(s, [
    ["키", "언어", "성별", "음성 이름", "선택 방법"],
    ["ko_female", "한국어", "여성", "SunHi", "웹 화면 (기본값)"],
    ["ko_male", "한국어", "남성", "Hyunsu", "웹 화면"],
    ["en_female", "영어(미국)", "여성", "Jenny", "웹 화면"],
    ["en_male", "영어(미국)", "남성", "Guy", "웹 화면"],
    ["ja_male", "일본어", "남성", "Keita", "API 호출만 (부록 참고)"],
    ["zh_male", "중국어(간체)", "남성", "Yunxi", "API 호출만 (부록 참고)"],
  ], M, 1.95, 7.5, [1.4, 1.35, 0.8, 1.35, 2.6], { monoCols: [0], rowH: 0.42, fontSize: 11.5 });
  T(s, "말하기 속도는 현재 고정(기본 속도)입니다. 언어별 영상이 필요하면 노트를 해당 언어로 바꿔 다시 업로드하세요.", M, 5.1, 7.5, 0.6, { fontSize: 11.5, color: C.muted, lineSpacingMultiple: 1.2 });

  const rx = 8.6, rw = W - M - rx;
  R(s, rx, 1.5, rw, 5.1, C.tint);
  T(s, "화면 전환 여백", rx + 0.3, 1.7, rw - 0.6, 0.4, { fontSize: 15, bold: true, color: C.ink });
  T(s, "1.5초", rx + 0.3, 2.15, rw - 0.6, 0.9, { fontSize: 44, bold: true, color: C.primary });
  T(s, "기본값 · 허용 범위 0 ~ 10초", rx + 0.3, 3.05, rw - 0.6, 0.35, { fontSize: 11.5, color: C.muted });
  // 타임라인 그래픽
  const tx = rx + 0.3, ty = 3.6, tw = rw - 0.6;
  Rect(s, tx, ty, tw * 0.22, 0.42, C.tint2);
  T(s, "여백", tx, ty, tw * 0.22, 0.42, { fontSize: 10, color: C.ink, align: "center", valign: "middle" });
  Rect(s, tx + tw * 0.22, ty, tw * 0.78, 0.42, C.primary);
  T(s, "나레이션 (음성 길이)", tx + tw * 0.22, ty, tw * 0.78, 0.42, { fontSize: 10, color: C.white, align: "center", valign: "middle" });
  T(s, "◀ 슬라이드 시작", tx, ty + 0.48, 2, 0.3, { fontSize: 9.5, color: C.muted });
  T(s, "슬라이드 끝 ▶", tx + tw - 2, ty + 0.48, 2, 0.3, { fontSize: 9.5, color: C.muted, align: "right" });
  bullets(s, [
    "슬라이드가 바뀐 뒤 나레이션이 시작되기까지 화면만 보여 주는 시간입니다.",
    "각 슬라이드 길이 = 여백 + 음성 길이. 대본이 없는 슬라이드는 여백만큼만 표시됩니다.",
    "자막(SRT) 타임코드에도 같은 값이 반영됩니다.",
  ], rx + 0.3, 4.55, rw - 0.6, 2.0, { fontSize: 11.5 });
  notes(s, "설정 옵션", "목소리는 여섯 종을 지원하며, 웹 화면에서는 한국어와 영어 네 종을 고를 수 있습니다. 화면 전환 여백은 슬라이드가 바뀐 뒤 나레이션이 시작되기까지의 시간으로, 기본값은 일 점 오 초입니다.");
}

// =====================================================================
// 11. 진행 상황
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "5 · PROGRESS", "진행 상황 확인 — 진행률이 알려 주는 것");
  table(s, [
    ["진행률", "화면 메시지", "서버가 하는 일"],
    ["10%", "노트 추출 중...", "숨김 슬라이드를 제외하고 노트에서 대본을 뽑습니다."],
    ["30%", "슬라이드 이미지 변환 중...", "Keynote(또는 LibreOffice)로 PDF를 만든 뒤 슬라이드별 PNG로 변환합니다."],
    ["30 → 80%", "N번째 슬라이드 영상 생성 중...", "슬라이드마다 음성을 합성하고 이미지와 합쳐 클립을 만듭니다. 가장 오래 걸리는 구간입니다."],
    ["85%", "YouTube 업로드용 SRT 자막 생성 중...", "음성 길이를 누적해 자막 타임코드를 계산합니다."],
    ["90%", "전체 영상 병합 중...", "클립을 하나의 MP4로 이어 붙입니다."],
    ["100%", "🎉 영상 생성이 완료되었습니다!", "다운로드 버튼이 나타납니다."],
  ], M, 1.5, 7.9, [1.1, 2.9, 3.9], { boldCols: [0], rowH: 0.52, fontSize: 11 });

  const rx = 8.85, rw = W - M - rx;
  infoCard(s, rx, 1.5, rw, 2.1, "소요 시간", "음성 합성이 슬라이드마다 순서대로 진행되므로 대본 길이와 장수에 비례해 늘어납니다. 참고로 14장·나레이션 6분 36초짜리 가이드 영상이 로컬 Mac에서 수 분 안에 완성됩니다.", { bodySize: 11.5 });
  infoCard(s, rx, 3.8, rw, 1.4, "갱신 주기", "진행률은 2초마다 서버에 확인해 갱신됩니다. 잠시 같은 숫자에 머무는 것은 정상입니다.", { bodySize: 11.5 });
  note(s, "작업 중 브라우저 탭을 닫거나 새로고침하면 결과 화면으로 돌아올 수 없습니다. 이 경우 결과물은 서버 작업 폴더에서 직접 가져옵니다(다음 장).", rx, 5.4, rw, 1.2, "warn");
  T(s, "진행률이 멈춘 지점이 곧 문제가 생긴 단계입니다. 0%는 워커 미실행, 30%는 이미지 변환(Keynote), 90%는 병합 단계를 의심하세요.", M, 5.55, 7.9, 0.8, { fontSize: 11.5, color: C.muted, lineSpacingMultiple: 1.2 });
  notes(s, "진행 상황", "업로드 후 화면에 진행률이 표시됩니다. 십 퍼센트는 노트 추출, 삼십 퍼센트는 이미지 변환, 삼십에서 팔십 퍼센트는 슬라이드별 음성과 클립 생성, 팔십오는 자막, 구십은 병합 단계입니다. 진행률이 멈춘 지점을 보면 어느 단계에서 문제가 생겼는지 알 수 있습니다.");
}

// =====================================================================
// 12. 결과 다운로드
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "6 · RESULT", "결과물 받기 — 영상은 버튼으로, 자막은 작업 폴더에서");
  // 완료 화면 목업
  const ax = M, ay = 1.55, aw = 5.2, ah = 2.6;
  R(s, ax, ay, aw, ah, C.appBg, { rectRadius: 0.12 });
  T(s, "🎉 영상 생성이 완료되었습니다!", ax, ay + 0.5, aw, 0.5, { fontSize: 15, bold: true, color: C.white, align: "center" });
  R(s, ax + 1.2, ay + 1.3, aw - 2.4, 0.6, "3B82F6", { rectRadius: 0.08 });
  T(s, "영상 다운로드 (MP4)", ax + 1.2, ay + 1.3, aw - 2.4, 0.6, { fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
  T(s, "완료 화면", ax, ay + ah + 0.1, aw, 0.3, { fontSize: 10.5, color: C.muted, align: "center" });

  infoCard(s, M, 4.6, 5.2, 2.0, "MP4 영상", "다운로드 버튼을 누르면 브라우저 다운로드 폴더에 저장됩니다.\n파일명:  slide_video_{작업ID 앞 8자리}.mp4", { badge: "▶", badgeColor: C.primary, bodySize: 11.5 });

  // 오른쪽: SRT 위치
  const rx = 6.2, rw = W - M - rx;
  R(s, rx, 1.55, rw, 5.05, C.tint);
  circle(s, rx + 0.25, 1.8, 0.42, C.coral, "≡", { fontSize: 13 });
  T(s, "SRT 자막과 나머지 산출물", rx + 0.8, 1.8, rw - 1.0, 0.42, { fontSize: 15, bold: true, color: C.ink, valign: "middle" });
  T(s, "현재 화면에는 영상 다운로드 버튼만 있습니다. 자막 파일은 서버의 작업 폴더에서 직접 복사합니다. 작업 폴더는 작업 ID(UUID)마다 하나씩 만들어집니다.",
    rx + 0.25, 2.35, rw - 0.5, 0.8, { fontSize: 11.5, lineSpacingMultiple: 1.2 });
  code(s, [
    "# 가장 최근 작업 폴더 열기",
    "open $(ls -td /tmp/slidenarrator_uploads/*/ | head -1)",
    "",
    "# 폴더 안 파일 구성",
    "final_{작업ID}.mp4        최종 영상",
    "subtitles_{작업ID}.srt    YouTube용 자막",
    "slide_001.png ...        슬라이드 이미지 (중간 산출물)",
    "audio_001.mp3 ...        슬라이드별 음성 (중간 산출물)",
    "clip_001.mp4 ...         슬라이드별 클립 (중간 산출물)",
  ], rx + 0.25, 3.25, rw - 0.5, 2.55, { fontSize: 10.5 });
  T(s, "작업 폴더는 자동으로 지워지지 않습니다. 중간 산출물이 쌓이면 디스크를 차지하니 필요한 파일을 옮긴 뒤 폴더를 삭제하세요.", rx + 0.25, 5.9, rw - 0.5, 0.6, { fontSize: 10.5, color: C.muted, lineSpacingMultiple: 1.2 });
  notes(s, "결과물 받기", "작업이 끝나면 다운로드 버튼으로 영상을 받습니다. 자막 파일은 화면에서 받을 수 없고, 서버의 작업 폴더에서 직접 복사합니다. 작업 폴더에는 중간 산출물도 함께 남으니 필요한 파일을 옮긴 뒤 정리해 주세요.");
}

// =====================================================================
// 13. 산출물 규격
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "6 · OUTPUT SPEC", "산출물 규격 — MP4와 SRT");
  T(s, "final_{작업ID}.mp4", M, 1.5, 6, 0.4, { fontSize: 15, bold: true, color: C.ink, fontFace: MONO });
  table(s, [
    ["항목", "값"],
    ["해상도", "1920 × 1080 (Full HD, 16:9)"],
    ["프레임", "30 fps"],
    ["비디오 코덱", "H.264 (libx264), CRF 18"],
    ["오디오 코덱", "AAC 192 kbps · 48 kHz 스테레오"],
    ["슬라이드 길이", "전환 여백 + 음성 길이 (무음 슬라이드는 여백만)"],
    ["전체 길이", "모든 슬라이드 길이의 합"],
  ], M, 1.95, 6.0, [1.7, 4.3], { boldCols: [0], rowH: 0.44, fontSize: 11.5 });
  note(s, "휴대폰·PC·YouTube 어디서나 재생되는 표준 규격입니다. 별도 변환 없이 바로 올릴 수 있습니다.", M, 5.2, 6.0, 0.6, "ok");

  const rx = 7.1, rw = W - M - rx;
  T(s, "subtitles_{작업ID}.srt", rx, 1.5, rw, 0.4, { fontSize: 15, bold: true, color: C.ink, fontFace: MONO });
  code(s, [
    "1",
    "00:00:01,500 --> 00:00:16,548",
    "안녕하세요. 슬라이드캐스트 사용자 매뉴얼입니다.",
    "",
    "2",
    "00:00:18,048 --> 00:00:29,310",
    "매뉴얼은 여덟 부분으로 구성됩니다.",
  ], rx, 1.95, rw, 2.35, { fontSize: 11 });
  bullets(s, [
    "슬라이드마다 자막 1개. 대본 전체가 한 블록으로 들어갑니다.",
    "시작 시각 = 이전 슬라이드까지의 누적 길이 + 전환 여백",
    "대본이 없는 슬라이드는 자막 번호를 건너뜁니다.",
    "UTF-8 인코딩. 메모장·VS Code에서 열어 오타를 고칠 수 있습니다.",
  ], rx, 4.5, rw, 2.0, { fontSize: 11.5 });
  notes(s, "산출물 규격", "영상은 풀에이치디 해상도, 초당 삼십 프레임, 에이치이륙사 비디오와 에이에이씨 오디오로 만들어집니다. 자막은 슬라이드마다 한 블록씩 들어가며, 타임코드는 실제 음성 길이를 누적해 계산하므로 영상과 정확히 맞습니다.");
}

// =====================================================================
// 14. YouTube 업로드
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "6 · YOUTUBE", "YouTube에 올리기 — 영상과 자막을 함께");
  const steps = [
    ["영상 업로드", "YouTube Studio → 만들기 → 동영상 업로드에서 내려받은 MP4를 선택합니다."],
    ["세부정보 입력", "제목·설명·썸네일을 입력합니다. 설명란에 슬라이드별 시작 시각을 적으면 챕터가 됩니다."],
    ["자막 추가", "왼쪽 메뉴 자막 → 언어 선택 → 파일 업로드 → '타이밍 포함'을 고르고 SRT 파일을 올립니다."],
    ["공개 설정", "공개 범위와 예약 시간을 정하고 게시합니다. 자막은 시청자가 CC 버튼으로 켤 수 있습니다."],
  ];
  const cw = (W - 2 * M - 0.75) / 4;
  steps.forEach((st, i) => {
    const x = M + i * (cw + 0.25), y = 1.6;
    R(s, x, y, cw, 2.45, C.tint);
    circle(s, x + 0.22, y + 0.22, 0.5, C.coral, i + 1, { fontSize: 15 });
    T(s, st[0], x + 0.85, y + 0.22, cw - 1.05, 0.5, { fontSize: 14.5, bold: true, color: C.ink, valign: "middle" });
    T(s, st[1], x + 0.22, y + 0.95, cw - 0.44, 1.4, { fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.2 });
    if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + cw + 0.03, y: y + 1.3, w: 0.19, h: 0.3, fill: { color: C.line }, line: { color: C.line, width: 0 } });
  });
  infoCard(s, M, 4.4, 6.0, 1.9, "자막 언어는 대본 언어와 같게", "한국어 대본이면 '한국어', 영어 대본이면 'English'를 고르세요. 다른 언어 자막이 필요하면 SRT 파일의 텍스트만 번역해 같은 방식으로 추가하면 됩니다.", { bodySize: 11.5 });
  infoCard(s, 6.85, 4.4, W - M - 6.85, 1.9, "챕터 만들기", "SRT의 시작 시각을 '0:00 소개, 1:32 설치' 형식으로 설명란에 적으면 YouTube가 챕터로 인식합니다. 첫 항목은 반드시 0:00이어야 합니다.", { bodySize: 11.5 });
  notes(s, "유튜브 업로드", "유튜브에 올릴 때는 먼저 영상을 업로드하고, 세부정보를 입력한 뒤, 자막 메뉴에서 타이밍 포함 옵션으로 에스알티 파일을 추가합니다. 자막 언어는 대본 언어와 같게 골라 주세요.");
}

// =====================================================================
// 15. 오류 메시지
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "7 · ERRORS", "오류 메시지별 원인과 조치");
  table(s, [
    ["화면에 표시되는 메시지", "원인", "조치"],
    ["PPTX 파일만 업로드할 수 있습니다.", ".pptx가 아닌 파일(.ppt, .key, .pdf 등)", "PowerPoint 또는 Keynote에서 .pptx로 다시 저장"],
    ["올바른 PPTX 파일이 아닙니다.", "확장자만 .pptx로 바꾼 파일, 손상된 파일", "원본 프로그램에서 다시 내보내기"],
    ["파일 크기가 제한(100MB)을 초과했습니다.", "고해상도 이미지·영상이 많이 포함됨", "이미지 압축(파일 → 압축) 후 재저장, 영상 개체 제거"],
    ["빈 파일입니다.", "0바이트 파일이 업로드됨", "파일을 다시 저장한 뒤 업로드"],
    ["화면 전환 여백은 0~10초 사이여야 합니다.", "여백에 음수 또는 10 초과 값을 입력", "0~10 사이 값으로 수정"],
    ["영상 생성에 실패했습니다: 변환할 슬라이드가 없습니다.", "모든 슬라이드가 숨김이거나 슬라이드가 없음", "최소 1장의 슬라이드를 표시 상태로 변경"],
    ["영상 생성에 실패했습니다: 슬라이드가 너무 많습니다.", "표시 슬라이드가 100장 초과", "파일을 2개 이상으로 나눠 업로드"],
    ["영상 생성에 실패했습니다: ... 개수가 일치하지 않습니다.", "이미지 변환 결과가 대본 수와 다름 (변환기 문제)", "Keynote 종료 후 재시도, 계속되면 관리자에게 문의"],
    ["업로드 중 오류가 발생했습니다.", "웹 서버(터미널 3)가 꺼져 있거나 네트워크 문제", "터미널 3의 uvicorn 실행 여부 확인 후 재시도"],
  ], M, 1.5, W - 2 * M, [4.3, 3.7, 4.13], { boldCols: [0], rowH: 0.47, fontSize: 10.5, headSize: 11.5 });
  T(s, "실패 메시지는 진행률 화면 대신 알림창으로 표시되고, 업로드 화면으로 되돌아갑니다. 워커 터미널(터미널 2)의 로그에 더 자세한 원인이 남습니다.", M, 6.35, W - 2 * M, 0.5, { fontSize: 11, color: C.muted });
  notes(s, "오류 메시지", "화면에 표시되는 오류 메시지별 원인과 조치입니다. 대부분은 파일 형식, 용량, 설정값 문제로 사용자가 바로 고칠 수 있습니다. 자세한 원인은 워커 터미널의 로그에 남습니다.");
}

// =====================================================================
// 16. 문제 해결 FAQ
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "7 · TROUBLESHOOTING", "이런 증상이 나오면");
  table(s, [
    ["증상", "가장 흔한 원인", "조치"],
    ["특정 슬라이드가 소리 없이 지나감", "노트를 한 줄만 작성 (첫 줄은 제외됨)", "노트를 두 줄 이상으로 수정 후 재업로드"],
    ["진행률이 0%에서 멈춤", "Celery 워커(터미널 2)가 실행되지 않음", "워커를 실행하고 파일을 다시 업로드"],
    ["진행률이 30%에서 오래 멈춤", "Keynote가 대화상자(권한·복구 등)를 띄우고 대기 중", "Keynote 창을 확인해 대화상자를 닫음. 반복되면 Keynote를 종료해 LibreOffice로 변환"],
    ["영상 전체에 소리가 없음", "인터넷 연결 끊김 (edge-tts는 온라인 서비스)", "네트워크 확인 후 재업로드"],
    ["한글이 네모(□)로 깨짐", "Linux 서버에 한글 폰트 미설치 (Mac은 해당 없음)", "서버에 나눔고딕 등 한글 폰트 설치"],
    ["영상 좌우에 검은 여백", "4:3 등 16:9가 아닌 슬라이드 비율", "디자인 → 슬라이드 크기를 16:9로 변경"],
    ["새로고침해서 결과 화면이 사라짐", "브라우저가 작업 ID를 잃음", "작업 폴더(/tmp/slidenarrator_uploads/최근 폴더)에서 직접 복사"],
    ["'영상을 찾을 수 없거나 아직 완성되지 않았습니다'", "완료 전에 다운로드 주소를 열었거나 폴더가 삭제됨", "100% 완료 후 다시 시도"],
  ], M, 1.5, W - 2 * M, [3.6, 4.0, 4.53], { boldCols: [0], rowH: 0.5, fontSize: 10.5, headSize: 11.5 });
  note(s, "위 조치로 해결되지 않으면 워커 터미널의 마지막 오류 줄과 사용한 PPTX 파일을 관리자에게 전달하세요.", M, 6.15, W - 2 * M, 0.6, "info");
  notes(s, "문제 해결", "자주 나오는 증상입니다. 특정 슬라이드가 소리 없이 지나가면 노트가 한 줄뿐인 경우가 대부분이고, 진행률이 영 퍼센트에서 멈추면 워커가 실행되지 않은 것입니다. 삼십 퍼센트에서 오래 멈추면 키노트가 대화상자를 띄우고 기다리는 중일 수 있습니다.");
}

// =====================================================================
// 17. 부록 A: API
// =====================================================================
{
  const s = pres.addSlide();
  header(s, "8 · APPENDIX A", "API로 사용하기 — 자동화와 일본어·중국어 목소리");
  T(s, "웹 화면 없이 터미널이나 스크립트에서 같은 기능을 쓸 수 있습니다. 화면에 없는 ja_male, zh_male 목소리도 여기서 지정합니다.", M, 1.5, W - 2 * M, 0.5, { fontSize: 12.5 });
  const cw = (W - 2 * M - 0.5) / 3;
  const blocks = [
    ["1", "업로드 → 작업 ID 받기", [
      "curl -X POST http://localhost:8000/api/upload \\",
      "  -F \"file=@deck.pptx\" \\",
      "  -F \"voice_key=ja_male\" \\",
      "  -F \"delay_sec=2\"",
      "",
      "> {\"job_id\": \"3f2a...-...\",",
      ">  \"message\": \"파일 업로드 완료 및",
      ">   작업 큐에 등록되었습니다.\"}",
    ]],
    ["2", "진행 상태 조회", [
      "curl http://localhost:8000/api/jobs/{job_id}",
      "",
      "> {\"status\": \"PROGRESS\",",
      ">  \"progress\": 45,",
      ">  \"message\": \"3번째 슬라이드 ...\"}",
      "",
      "# status 값: PENDING → PROGRESS",
      "#   → SUCCESS 또는 FAILURE(error 포함)",
    ]],
    ["3", "영상 내려받기", [
      "curl -o result.mp4 \\",
      "  http://localhost:8000/api/download/{job_id}",
      "",
      "# 자막은 서버 파일 시스템에서 복사",
      "cp /tmp/slidenarrator_uploads/{job_id}/\\",
      "   subtitles_{job_id}.srt .",
    ]],
  ];
  blocks.forEach((b, i) => {
    const x = M + i * (cw + 0.25), y = 2.15;
    circle(s, x, y, 0.42, C.primary, b[0], { fontSize: 13 });
    T(s, b[1], x + 0.55, y, cw - 0.55, 0.42, { fontSize: 14, bold: true, color: C.ink, valign: "middle" });
    code(s, b[2], x, y + 0.6, cw, 2.7, { fontSize: 9.5 });
  });
  note(s, "전체 API 문서는 서버 실행 중 http://localhost:8000/docs 에서 볼 수 있습니다. 입력 규칙(voice_key 목록, delay_sec 0~10, 100MB)은 화면과 동일합니다.", M, 5.7, W - 2 * M, 0.7, "info");
  notes(s, "API 사용", "웹 화면 없이도 에이피아이로 같은 기능을 쓸 수 있습니다. 업로드로 작업 아이디를 받고, 상태를 조회하고, 완료되면 영상을 내려받는 세 단계입니다. 화면에 없는 일본어와 중국어 목소리도 여기서 지정할 수 있습니다.");
}

// =====================================================================
// 18. 부록 B: 체크리스트 + 마무리
// =====================================================================
{
  const s = pres.addSlide();
  pageNo += 1;
  s.background = { color: C.ink };
  T(s, "8 · APPENDIX B", M, 0.42, 6, 0.3, { fontSize: 11, bold: true, color: "A5B4FC", charSpacing: 2 });
  T(s, "업로드 전 체크리스트", M, 0.72, 8, 0.6, { fontSize: 26, bold: true, color: C.white });
  const checks = [
    ["모든 슬라이드의 노트가 2줄 이상인가", "첫 줄은 제외되므로 대본은 2번째 줄부터"],
    ["문장을 짧게 끊었는가", "슬라이드당 2~4문장, 마침표 기준으로 호흡"],
    ["숫자·약어·URL을 정리했는가", "읽히면 어색한 표현은 한글로 풀거나 삭제"],
    ["안 쓰는 슬라이드를 숨겼는가", "숨김 슬라이드는 영상과 대본에서 함께 제외"],
    ["16:9 비율 · 100MB · 100장 이내인가", "초과 시 업로드 거부 또는 레터박스"],
    ["목소리와 여백을 파일을 놓기 전에 골랐는가", "파일을 놓는 즉시 업로드가 시작됨"],
  ];
  checks.forEach((c, i) => {
    const col = i < 3 ? 0 : 1, row = i % 3;
    const x = M + col * 6.2, y = 1.65 + row * 1.25;
    R(s, x, y, 5.95, 1.05, "2B2866");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: y + 0.32, w: 0.4, h: 0.4, fill: { color: C.ink }, line: { color: "A5B4FC", width: 1.5 }, rectRadius: 0.08 });
    T(s, c[0], x + 0.85, y + 0.15, 4.9, 0.4, { fontSize: 13.5, bold: true, color: C.white });
    T(s, c[1], x + 0.85, y + 0.55, 4.9, 0.4, { fontSize: 11, color: "C7C9E8" });
  });
  Rect(s, M, 5.5, W - 2 * M, 0.02, "3B3880");
  T(s, "한 줄 요약", M, 5.7, 3, 0.3, { fontSize: 11, bold: true, color: C.coral, charSpacing: 2 });
  T(s, "노트 2번째 줄부터가 대본이고, 나머지는 전부 자동입니다.", M, 6.0, 8, 0.5, { fontSize: 20, bold: true, color: C.white });
  T(s, "함께 보기:  README.md  ·  docs/guide/SlideCast_퀵가이드.pptx (14장 요약 가이드)", M, 6.55, 9, 0.35, { fontSize: 11, color: "8B8DB8" });
  T(s, `${pageNo} / ${TOTAL}`, W - M - 1.2, 7.05, 1.2, 0.25, { fontSize: 9.5, color: "8B8DB8", align: "right" });
  notes(s, "마무리", "업로드 전에 이 체크리스트를 한 번 훑어보세요. 노트가 두 줄 이상인지, 문장이 짧은지, 안 쓰는 슬라이드를 숨겼는지, 비율과 용량이 맞는지 확인하면 됩니다. 노트 두 번째 줄부터가 대본이고, 나머지는 전부 자동입니다. 감사합니다.");
}

pres.writeFile({ fileName: out }).then(f => console.log("written:", f));
