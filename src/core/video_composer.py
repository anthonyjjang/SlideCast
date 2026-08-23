import subprocess
import os

VIDEO_WIDTH, VIDEO_HEIGHT = 1920, 1080
VIDEO_FPS = 30

# concat demuxer의 `-c copy`는 모든 입력 클립의 스트림 구성이 완전히 동일해야 한다.
# 슬라이드마다 TTS 음원 규격(edge-tts는 24kHz 모노)이 달라지거나 무음 슬라이드에
# 오디오 트랙이 아예 없으면 병합이 실패하거나 오디오가 통째로 소실되므로,
# 모든 클립을 아래 규격으로 강제 통일한다.
AUDIO_RATE = 48000
AUDIO_CHANNELS = 2
AUDIO_BITRATE = "192k"

VIDEO_FILTER = (
    f"[0:v]scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,"
    f"pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,"
    f"fps={VIDEO_FPS},format=yuv420p[v]"
)


def get_audio_duration(path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True
    )
    return float(r.stdout.strip())


def create_slide_video(img_path: str, audio_path: str, out_path: str, delay_sec: float = 1.5) -> str:
    """
    단일 슬라이드 이미지와 오디오를 합성하여 비디오 클립을 생성합니다.

    대본이 없는(무음) 슬라이드도 `anullsrc`로 무음 트랙을 넣어 오디오 스트림을 유지한다.
    이렇게 해야 concat_videos()의 `-c copy` 병합에서 스트림 구성이 어긋나지 않는다.
    """
    delay_ms = int(delay_sec * 1000)
    has_audio = bool(audio_path) and os.path.exists(audio_path)

    if has_audio:
        # 오디오를 delay_sec 만큼 뒤로 밀고, 규격을 통일한 뒤 영상 길이에 맞춰 무음 패딩
        total_dur = get_audio_duration(audio_path) + delay_sec
        audio_input = ["-i", audio_path]
        audio_filter = (
            f"[1:a]adelay={delay_ms}|{delay_ms},"
            f"aresample={AUDIO_RATE},"
            f"aformat=sample_fmts=fltp:channel_layouts=stereo,"
            f"apad[a]"
        )
    else:
        # 무음 슬라이드: delay_sec 길이의 무음 트랙 생성
        total_dur = delay_sec
        audio_input = [
            "-f", "lavfi",
            "-i", f"anullsrc=channel_layout=stereo:sample_rate={AUDIO_RATE}",
        ]
        audio_filter = "[1:a]aformat=sample_fmts=fltp:channel_layouts=stereo[a]"

    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", img_path,
        *audio_input,
        "-filter_complex", f"{VIDEO_FILTER};{audio_filter}",
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-ar", str(AUDIO_RATE), "-ac", str(AUDIO_CHANNELS),
        "-t", f"{total_dur:.3f}",
        out_path
    ], capture_output=True, check=True)

    return out_path


def concat_videos(video_paths: list[str], output_path: str) -> str:
    """
    생성된 개별 슬라이드 비디오 클립들을 하나로 합칩니다.
    """
    if not video_paths:
        return ""

    list_path = os.path.join(os.path.dirname(output_path), "concat_list.txt")
    with open(list_path, "w") as f:
        for p in video_paths:
            f.write(f"file '{os.path.abspath(p)}'\n")

    base_cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path]

    try:
        # 모든 클립이 동일 규격이므로 무손실 스트림 복사로 즉시 병합
        subprocess.run(base_cmd + ["-c", "copy", output_path],
                       capture_output=True, check=True)
    except subprocess.CalledProcessError as e:
        # 방어적 폴백: 어떤 이유로든 규격이 어긋나면 재인코딩해서라도 병합을 성공시킨다
        print(f"concat -c copy failed, falling back to re-encode: {e.stderr.decode(errors='replace')[-500:]}")
        subprocess.run(base_cmd + [
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", AUDIO_BITRATE,
            "-ar", str(AUDIO_RATE), "-ac", str(AUDIO_CHANNELS),
            "-pix_fmt", "yuv420p", "-r", str(VIDEO_FPS),
            output_path
        ], capture_output=True, check=True)

    os.remove(list_path)
    return output_path
