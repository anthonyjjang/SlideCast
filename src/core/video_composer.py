import subprocess
import os

VIDEO_WIDTH, VIDEO_HEIGHT = 1920, 1080

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
    (기존 로컬 파이프라인 ref/generate_video.py의 안정적인 subprocess 방식을 채택)
    """
    delay_ms = int(delay_sec * 1000)
    
    if not audio_path or not os.path.exists(audio_path):
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", img_path,
            "-vf", f"scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,"
                   f"pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-t", str(delay_sec),
            out_path
        ], capture_output=True, check=True)
        return out_path
        
    audio_dur = get_audio_duration(audio_path)
    total_dur = audio_dur + delay_sec

    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", img_path,
        "-i", audio_path,
        "-filter_complex", f"[1:a]adelay={delay_ms}|{delay_ms},apad[a]",
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
            
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", list_path,
        "-c", "copy", output_path
    ], capture_output=True, check=True)
    
    os.remove(list_path)
    return output_path
