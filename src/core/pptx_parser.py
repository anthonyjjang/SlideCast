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
                raw_notes = text_frame.text.strip()
                if raw_notes:
                    # 첫 줄(제목/키메시지) 제외하고 나머지 전체를 스크립트로 사용
                    lines = raw_notes.split('\n', 1)
                    notes = lines[1].strip() if len(lines) > 1 else ""
        
        slides.append({
            "slide_no": i + 1,
            "notes": notes
        })
        
    return slides
