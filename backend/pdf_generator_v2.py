# PDF Generator v3 - Image-based rendering for proper complex script support
# Uses Pillow for text rendering which handles Sinhala/Tamil conjuncts correctly

import logging
from pathlib import Path
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Spacer, HRFlowable, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet

logger = logging.getLogger(__name__)

# Get the fonts directory
ROOT_DIR = Path(__file__).parent
FONTS_DIR = ROOT_DIR / "fonts"

# Font mapping for different languages
FONT_FILES = {
    "en": "NotoSans-Regular.ttf",
    "si": "NotoSansSinhala-Regular.ttf",
    "ta": "NotoSansTamil-Regular.ttf",
    "ar": "NotoSansArabic-Regular.ttf",
    "hi": "NotoSansDevanagari-Regular.ttf",
    "zh-CN": "NotoSansSC-Regular-0.ttf",  # Simplified Chinese
    "zh": "NotoSansSC-Regular-0.ttf",  # Chinese fallback
    "bn": "NotoSansBengali-Regular.ttf",
    "ur": "NotoSansArabic-Regular.ttf",
    "id": "NotoSans-Regular.ttf",
    "ms": "NotoSans-Regular.ttf",
}


def is_sinhala_word(word):
    """Check if word contains Sinhala characters"""
    for char in word:
        code = ord(char)
        if 0x0D80 <= code <= 0x0DFF:
            return True
    return False


def is_tamil_word(word):
    """Check if word contains Tamil characters"""
    for char in word:
        code = ord(char)
        if 0x0B80 <= code <= 0x0BFF:
            return True
    return False


def is_chinese_word(word):
    """Check if word contains Chinese characters"""
    for char in word:
        code = ord(char)
        # CJK Unified Ideographs and extensions
        if (0x4E00 <= code <= 0x9FFF or  # CJK Unified Ideographs
            0x3400 <= code <= 0x4DBF or  # CJK Extension A
            0x20000 <= code <= 0x2A6DF or  # CJK Extension B
            0x2A700 <= code <= 0x2B73F or  # CJK Extension C
            0x2B740 <= code <= 0x2B81F or  # CJK Extension D
            0xF900 <= code <= 0xFAFF or  # CJK Compatibility Ideographs
            0x2F00 <= code <= 0x2FDF or  # Kangxi Radicals
            0x3000 <= code <= 0x303F):  # CJK Symbols and Punctuation
            return True
    return False


def is_arabic_word(word):
    """Check if word contains Arabic characters"""
    for char in word:
        code = ord(char)
        if 0x0600 <= code <= 0x06FF or 0x0750 <= code <= 0x077F:
            return True
    return False


def is_hindi_word(word):
    """Check if word contains Hindi/Devanagari characters"""
    for char in word:
        code = ord(char)
        if 0x0900 <= code <= 0x097F:
            return True
    return False


def is_bengali_word(word):
    """Check if word contains Bengali characters"""
    for char in word:
        code = ord(char)
        if 0x0980 <= code <= 0x09FF:
            return True
    return False

def get_font(language: str, size: int):
    """Get PIL font for the given language"""
    font_file = FONT_FILES.get(language, "NotoSans-Regular.ttf")
    font_path = FONTS_DIR / font_file
    
    try:
        return ImageFont.truetype(str(font_path), size)
    except Exception as e:
        logger.warning(f"Could not load font {font_path}: {e}")
        return ImageFont.load_default()


def render_line_with_fallback(draw, text: str, x: int, y: int, 
                               primary_font, fallback_font, 
                               primary_color, language: str):
    """
    Render a line of text, switching fonts only at word boundaries.
    This preserves complex script conjunct characters.
    """
    if language == "en":
        draw.text((x, y), text, font=primary_font, fill=primary_color)
        return
    
    # For Chinese, render the entire line with primary font (no word boundaries)
    if language in ["zh-CN", "zh"]:
        draw.text((x, y), text, font=primary_font, fill=primary_color)
        return
    
    # Split into words while preserving spaces
    words = text.split(' ')
    current_x = x
    
    for i, word in enumerate(words):
        # Determine if word needs primary (native) or fallback (latin) font
        needs_native = False
        if language == "si":
            needs_native = is_sinhala_word(word)
        elif language == "ta":
            needs_native = is_tamil_word(word)
        elif language == "ar" or language == "ur":
            needs_native = is_arabic_word(word)
        elif language == "hi":
            needs_native = is_hindi_word(word)
        elif language == "bn":
            needs_native = is_bengali_word(word)
        
        font_to_use = primary_font if needs_native else fallback_font
        
        # Draw the word
        draw.text((current_x, y), word, font=font_to_use, fill=primary_color)
        
        # Get word width and advance
        try:
            bbox = draw.textbbox((current_x, y), word, font=font_to_use)
            word_width = bbox[2] - bbox[0]
        except:
            word_width = len(word) * 10
        
        current_x += word_width
        
        # Add space between words (except for last word)
        if i < len(words) - 1:
            space_width = 8  # Fixed space width
            current_x += space_width


def render_text_block(text: str, language: str, font_size: int = 24,
                      text_color: tuple = (51, 51, 51), 
                      max_width: int = 1400, is_heading: bool = False) -> Image.Image:
    """Render a text block with word wrapping and font fallback"""
    
    # Load fonts
    primary_font = get_font(language, font_size)
    fallback_font = get_font("en", font_size)
    
    # Create temp image for measurements
    temp_img = Image.new('RGB', (1, 1), color='white')
    temp_draw = ImageDraw.Draw(temp_img)
    
    # Split into lines (handle newlines in content)
    raw_lines = text.split('\n')
    
    # Word wrap each line
    wrapped_lines = []
    for raw_line in raw_lines:
        if not raw_line.strip():
            wrapped_lines.append('')
            continue
        
        words = raw_line.split(' ')
        current_line = ''
        
        for word in words:
            test_line = current_line + ' ' + word if current_line else word
            
            # Measure with appropriate font
            try:
                bbox = temp_draw.textbbox((0, 0), test_line, font=primary_font)
                line_width = bbox[2] - bbox[0]
            except:
                line_width = len(test_line) * 15
            
            if line_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    wrapped_lines.append(current_line)
                current_line = word
        
        if current_line:
            wrapped_lines.append(current_line)
    
    if not wrapped_lines:
        wrapped_lines = ['']
    
    # Calculate image dimensions
    line_height = int(font_size * 1.5)
    padding = 20
    total_height = len(wrapped_lines) * line_height + padding * 2
    
    # Create the actual image
    img = Image.new('RGB', (max_width + padding * 2, total_height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw each line
    y = padding
    for line in wrapped_lines:
        render_line_with_fallback(
            draw, line, padding, y,
            primary_font, fallback_font,
            text_color, language
        )
        y += line_height
    
    return img


def image_to_rl_flowable(img: Image.Image, target_width: float) -> RLImage:
    """Convert PIL Image to ReportLab Image flowable"""
    buffer = BytesIO()
    img.save(buffer, format='PNG', optimize=True)
    buffer.seek(0)
    
    aspect_ratio = img.height / img.width
    target_height = target_width * aspect_ratio
    
    return RLImage(buffer, width=target_width, height=target_height)


def generate_pdf_v3(title: str, sections: list, language: str) -> bytes:
    """Generate PDF with image-based text rendering for proper complex script support"""
    
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Content width in pixels (for high quality rendering)
    content_width_pt = A4[0] - 30*mm  # ~165mm = ~467pt
    content_width_px = int(content_width_pt * 3)  # 3x for quality
    
    story = []
    
    # Title
    title_img = render_text_block(
        title, language, 
        font_size=48, 
        text_color=(75, 0, 130),  # Purple
        max_width=content_width_px,
        is_heading=True
    )
    story.append(image_to_rl_flowable(title_img, content_width_pt))
    
    # Branding (always English)
    branding_img = render_text_block(
        "TEC WORLD Worldwide (Pvt.) Ltd - 42 Years of Educational Excellence",
        "en",
        font_size=24,
        text_color=(102, 102, 102),
        max_width=content_width_px
    )
    story.append(image_to_rl_flowable(branding_img, content_width_pt))
    
    # Horizontal line
    story.append(HRFlowable(
        width="100%",
        thickness=1,
        color=HexColor('#4B0082'),
        spaceAfter=5*mm,
        spaceBefore=2*mm
    ))
    
    # Sections
    for section in sections:
        heading = section.get('heading', '')
        content = section.get('content', '')
        
        if heading:
            heading_img = render_text_block(
                heading, language,
                font_size=36,
                text_color=(46, 125, 50),  # Green
                max_width=content_width_px,
                is_heading=True
            )
            story.append(image_to_rl_flowable(heading_img, content_width_pt))
        
        if content:
            content_img = render_text_block(
                content, language,
                font_size=28,
                text_color=(51, 51, 51),
                max_width=content_width_px
            )
            story.append(image_to_rl_flowable(content_img, content_width_pt))
        
        story.append(Spacer(1, 3*mm))
    
    # Footer separator
    story.append(HRFlowable(
        width="100%",
        thickness=0.5,
        color=HexColor('#dddddd'),
        spaceAfter=3*mm,
        spaceBefore=5*mm
    ))
    
    # Footer
    footer_img = render_text_block(
        "© 2025 TEC WORLD Worldwide. All rights reserved. | www.tecaikids.com",
        "en",
        font_size=20,
        text_color=(102, 102, 102),
        max_width=content_width_px
    )
    story.append(image_to_rl_flowable(footer_img, content_width_pt))
    
    # Build PDF
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


async def generate_pdf_with_playwright(title: str, sections: list, language: str) -> bytes:
    """Main async entry point"""
    return generate_pdf_v3(title, sections, language)


def generate_pdf_sync(title: str, sections: list, language: str) -> bytes:
    """Synchronous wrapper"""
    return generate_pdf_v3(title, sections, language)
