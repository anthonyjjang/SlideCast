import os
import asyncio
from src.worker.celery_app import celery_app
from src.core.pptx_parser import extract_notes
from src.core.image_converter import convert_pptx_to_images
from src.core.tts_engine import generate_tts
from src.core.video_composer import create_slide_video, concat_videos, get_audio_duration
from src.core.subtitle_maker import create_srt

@celery_app.task(bind=True)
def process_presentation(self, job_id: str, pptx_path: str, output_dir: str, voice_key: str = "ko_female", delay_sec: float = 1.5):
    """
    업로드된 PPTX 파일에 대해 비동기로 전체 영상 변환 파이프라인을 실행합니다.
    """
    try:
        # 1. PPTX 파싱 (노트 추출)
        self.update_state(state='PROGRESS', meta={'progress': 10, 'message': '노트 추출 중...'})
        slides_info = extract_notes(pptx_path)
        
        # 2. 이미지 변환
        self.update_state(state='PROGRESS', meta={'progress': 30, 'message': '슬라이드 이미지 변환 중...'})
        image_paths = convert_pptx_to_images(pptx_path, output_dir)
        
        # 3. TTS 변환 및 클립 영상 합성
        video_paths = []
        for i, slide in enumerate(slides_info):
            self.update_state(
                state='PROGRESS', 
                meta={'progress': 30 + int(50 * (i / len(slides_info))), 'message': f'{i+1}번째 슬라이드 영상 생성 중...'}
            )
            notes = slide.get("notes", "")
            
            # 오디오 생성 및 길이 파악
            audio_path = os.path.join(output_dir, f"audio_{i+1:03d}.mp3")
            if notes:
                asyncio.run(generate_tts(notes, voice_key, audio_path))
                dur = get_audio_duration(audio_path)
                slide["audio_duration"] = dur
            else:
                slide["audio_duration"] = 0.0
            
            # 단일 클립 영상 생성
            clip_path = os.path.join(output_dir, f"clip_{i+1:03d}.mp4")
            create_slide_video(image_paths[i], audio_path, clip_path, delay_sec=delay_sec)
            video_paths.append(clip_path)

        # 자막(SRT) 파일 자동 생성
        self.update_state(state='PROGRESS', meta={'progress': 85, 'message': 'YouTube 업로드용 SRT 자막 생성 중...'})
        srt_path = os.path.join(output_dir, f"subtitles_{job_id}.srt")
        create_srt(slides_info, srt_path, default_delay=delay_sec)

        # 4. 전체 영상 병합
        self.update_state(state='PROGRESS', meta={'progress': 90, 'message': '전체 영상 병합 중...'})
        final_video_path = os.path.join(output_dir, f"final_{job_id}.mp4")
        concat_videos(video_paths, final_video_path)
        
        return {
            "status": "success", 
            "output_video": final_video_path,
            "output_srt": srt_path
        }

    except Exception as e:
        return {"status": "error", "error_message": str(e)}
