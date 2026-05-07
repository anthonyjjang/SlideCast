import ffmpeg
import os

def create_slide_video(img_path: str, audio_path: str, out_path: str, delay_sec: float = 1.5) -> str:
    """
    단일 슬라이드 이미지와 오디오를 합성하여 비디오 클립을 생성합니다.
    딜레이 시간 동안 이미지가 먼저 보이고 오디오가 재생됩니다.
    """
    delay_ms = int(delay_sec * 1000)
    
    # 오디오 파일이 없는 경우 정지 이미지만 생성
    if not audio_path or not os.path.exists(audio_path):
        (
            ffmpeg.input(img_path, loop=1, framerate=1)
            .output(
                out_path, 
                vcodec="libx264", preset="fast", crf=18,
                pix_fmt="yuv420p", t=delay_sec,
                vf="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"
            )
            .overwrite_output()
            .run(quiet=True)
        )
        return out_path
        
    audio_dur = float(ffmpeg.probe(audio_path)["format"]["duration"])
    total_dur = audio_dur + delay_sec

    (
        ffmpeg
        .input(img_path, loop=1, framerate=1)
        .output(
            ffmpeg.input(audio_path).audio.filter("adelay", f"{delay_ms}|{delay_ms}"),
            out_path,
            vf="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
            vcodec="libx264", preset="fast", crf=18,
            acodec="aac", audio_bitrate="192k",
            pix_fmt="yuv420p", t=total_dur
        )
        .overwrite_output()
        .run(quiet=True)
    )
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
            
    (
        ffmpeg
        .input(list_path, format='concat', safe=0)
        .output(output_path, c='copy')
        .overwrite_output()
        .run(quiet=True)
    )
    
    os.remove(list_path)
    return output_path
