import edge_tts
import asyncio
import os

VOICES = {
    "ko_male": "ko-KR-HyunsuMultilingualNeural",
    "ko_female": "ko-KR-SunHiNeural",
    "en_male": "en-US-GuyNeural",
    "en_female": "en-US-JennyNeural",
    "ja_male": "ja-JP-KeitaNeural",
    "zh_male": "zh-CN-YunxiNeural"
}

async def generate_tts(text: str, voice_key: str, output_path: str, rate: int = 0) -> str:
    """
    edge-tts를 사용하여 텍스트를 음성 파일(MP3)로 변환합니다.
    """
    if not text or not text.strip():
        # 스크립트가 없는 슬라이드의 경우 빈 오디오 리턴
        return ""
        
    rate_str = f"+{rate}%" if rate >= 0 else f"{rate}%"
    voice = VOICES.get(voice_key, VOICES["ko_female"])
    
    communicate = edge_tts.Communicate(text, voice, rate=rate_str)
    await communicate.save(output_path)
    
    return output_path
