import subprocess
import os
import tempfile
import fitz  # PyMuPDF

def convert_pptx_to_images(pptx_path: str, output_dir: str) -> list[str]:
    """
    LibreOffice를 사용해 PPTX를 PDF로 변환한 후, PyMuPDF(fitz)를 이용해 PNG 이미지로 변환합니다.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    temp_dir = output_dir
    base_name = os.path.splitext(os.path.basename(pptx_path))[0]
    pdf_path = os.path.join(temp_dir, f"{base_name}.pdf")
    
    abs_pptx = os.path.abspath(pptx_path)
    abs_pdf = os.path.abspath(pdf_path)

    # 1. PPTX -> PDF (Apple Keynote AppleScript 적용 - 한글 폰트 완벽 보존)
    applescript = f'''
    tell application "Keynote"
        activate
        set theFile to POSIX file "{abs_pptx}"
        set theDoc to open theFile
        export theDoc to POSIX file "{abs_pdf}" as PDF
        close theDoc saving no
    end tell
    '''
    
    try:
        # Mac 환경에서 Keynote 앱을 원격 제어하여 PDF 추출 (PowerPoint보다 훨씬 빠르고 안정적)
        subprocess.run(["osascript", "-e", applescript], check=True, capture_output=True)
    except Exception as e:
        # Keynote 제어 실패 시 기존 LibreOffice로 폴백
        print(f"Keynote AppleScript failed, fallback to LibreOffice: {e}")
        subprocess.run([
            "soffice", "--headless", "--convert-to", "pdf", 
            "--outdir", temp_dir, pptx_path
        ], check=True, capture_output=True)
    
    # 2. PDF -> PNG (PyMuPDF)
    doc = fitz.open(pdf_path)
    
    # MuPDF 에러 방지 (No common ancestor in structure tree)
    try:
        cat = doc.pdf_catalog()
        doc.xref_set_key(cat, "StructTreeRoot", "null")
    except Exception:
        pass

    image_paths = []
    
    for i in range(len(doc)):
        page = doc.load_page(i)
        # 300 DPI 상당의 고해상도 이미지 추출
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_path = os.path.join(output_dir, f"slide_{i+1:03d}.png")
        pix.save(img_path)
        image_paths.append(img_path)
        
    doc.close()
    
    # 정리
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
        
    return image_paths
