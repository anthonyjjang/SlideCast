import srt
import datetime

def create_srt(slides_info: list[dict], output_path: str, default_delay: float = 1.5) -> str:
    """
    슬라이드별 대본과 오디오 길이를 기반으로 전체 영상에 맞는 SRT 자막 파일을 생성합니다.
    """
    subtitles = []
    current_time = 0.0
    
    for i, slide in enumerate(slides_info):
        text = slide.get("notes", "").strip()
        dur = slide.get("audio_duration", 0.0)
        
        if not text:
            current_time += dur + default_delay
            continue
            
        start_td = datetime.timedelta(seconds=current_time + default_delay)
        end_td = datetime.timedelta(seconds=current_time + default_delay + dur)
        
        subtitles.append(
            srt.Subtitle(
                index=len(subtitles) + 1,
                start=start_td,
                end=end_td,
                content=text
            )
        )
        current_time += dur + default_delay

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt.compose(subtitles))
        
    return output_path
