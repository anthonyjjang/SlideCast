import re
from pptx import Presentation
from typing import List, Dict, Any

def extract_notes(pptx_path: str) -> List[Dict[str, Any]]:
    """
    PPTX 파일에서 슬라이드 번호와 노트(발표 스크립트)를 추출합니다.
    """
    prs = Presentation(pptx_path)
    slides = []
    
    for i, slide in enumerate(prs.slides):
        notes = ""
        if slide.has_notes_slide:
            text_frame = slide.notes_slide.notes_text_frame
            if text_frame:
                notes = text_frame.text.strip()
        
        slides.append({
            "slide_no": i + 1,
            "notes": notes
        })
        
    return slides
