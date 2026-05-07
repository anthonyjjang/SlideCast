import os
import subprocess

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
PNG_DIR    = os.path.join(BASE_DIR, "slides_png")
AUDIO_DIR  = os.path.join(BASE_DIR, "slide_audio")
OUTPUT_FILE = os.path.join(BASE_DIR, "발표_영상_최종.mp4")
WORK_DIR   = os.path.join(BASE_DIR, "tmp_video_work")

VIDEO_WIDTH, VIDEO_HEIGHT = 1920, 1080
SLIDE_DELAY = 1.5  # 화면 전환 후 오디오 시작까지 딜레이 (초)


def get_audio_duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True
    )
    return float(r.stdout.strip())


def create_slide_video(slide_no, img_path, audio_path, out_path, audio_dur):
    delay_ms = int(SLIDE_DELAY * 1000)
    total_dur = audio_dur + SLIDE_DELAY
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", img_path,
        "-i", audio_path,
        "-filter_complex", f"[1:a]adelay={delay_ms}|{delay_ms}[a]",
        "-map", "0:v",
        "-map", "[a]",
        "-vf", f"scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,"
               f"pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(total_dur),
        out_path
    ], capture_output=True, check=True)


def main():
    os.makedirs(WORK_DIR, exist_ok=True)
    segments_dir = os.path.join(WORK_DIR, "segments")
    os.makedirs(segments_dir, exist_ok=True)

    print("=" * 52)
    print("  발표 영상 생성 (슬라이드 No. 1:1 씽크)")
    print("=" * 52)

    # 슬라이드 목록 수집 및 매칭
    segment_files = []
    total_duration = 0
    missing = []

    slide_count = len([f for f in os.listdir(PNG_DIR) if f.endswith(".png")])
    print(f"\n슬라이드 {slide_count}장 처리 시작...\n")

    for i in range(1, slide_count + 1):
        img_path   = os.path.join(PNG_DIR, f"슬라이드{i}.png")
        audio_path = os.path.join(AUDIO_DIR, f"slide_{i:02d}.mp3")
        seg_path   = os.path.join(segments_dir, f"seg_{i:03d}.mp4")

        if not os.path.exists(img_path):
            print(f"  [{i:02d}] PNG 없음 - 건너뜀")
            missing.append(i)
            continue
        if not os.path.exists(audio_path):
            print(f"  [{i:02d}] 오디오 없음 - 건너뜀")
            missing.append(i)
            continue

        dur = get_audio_duration(audio_path)
        total_duration += dur + SLIDE_DELAY
        create_slide_video(i, img_path, audio_path, seg_path, dur)
        segment_files.append(seg_path)
        print(f"  [{i:02d}/{slide_count}] {dur:.1f}초 + 딜레이 {SLIDE_DELAY}초 완료")

    # concat
    list_path = os.path.join(WORK_DIR, "filelist.txt")
    with open(list_path, "w") as f:
        for seg in segment_files:
            f.write(f"file '{seg}'\n")

    print("\n전체 영상 합치는 중...")
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", list_path,
        "-c", "copy", OUTPUT_FILE
    ], capture_output=True, check=True)

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    m, s = divmod(int(total_duration), 60)
    print(f"\n{'=' * 52}")
    print(f"  완료! → {OUTPUT_FILE}")
    print(f"  파일 크기: {size_mb:.1f} MB")
    print(f"  총 재생시간: {m}분 {s}초")
    if missing:
        print(f"  누락 슬라이드: {missing}")
    print(f"{'=' * 52}")
    os.system(f"open '{OUTPUT_FILE}'")


if __name__ == "__main__":
    main()
