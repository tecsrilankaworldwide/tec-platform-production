# PDF Generator with proper complex script support
# Uses Pillow for text rendering + ReportLab for PDF generation
# This approach renders text as images to ensure proper Sinhala/Tamil/Arabic display

import asyncio
from pathlib import Path
from io import BytesIO
import base64
import logging
import os

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Get the fonts directory
ROOT_DIR = Path(__file__).parent
FONTS_DIR = ROOT_DIR / "fonts"

logger = logging.getLogger(__name__)

# Font file paths
FONT_FILES = {
    "en": "NotoSans-Regular.ttf",
    "si": "NotoSansSinhala-Regular.ttf",
    "ta": "NotoSansTamil-Regular.ttf",
    "ar": "NotoSansArabic-Regular.ttf",
    "hi": "NotoSansDevanagari-Regular.ttf",
    "ur": "NotoSansArabic-Regular.ttf",
    "bn": "NotoSansBengali-Regular.ttf",
    "zh-CN": "NotoSansSC-Regular.ttc",
    "id": "NotoSans-Regular.ttf",
    "ms": "NotoSans-Regular.ttf",
}

# Complex scripts that need image-based rendering
COMPLEX_SCRIPTS = ["si", "ta", "hi", "ar", "ur", "bn"]

# RTL languages
RTL_LANGUAGES = ["ar", "ur"]


def get_font_path(language: str) -> Path:
    """Get font file path for the specified language"""
    font_file = FONT_FILES.get(language, "NotoSans-Regular.ttf")
    font_path = FONTS_DIR / font_file
    
    # Handle .ttc files - use .ttf fallback
    if font_file.endswith('.ttc') or not font_path.exists():
        font_path = FONTS_DIR / "NotoSans-Regular.ttf"
    
    return font_path


def is_latin_char(char: str) -> bool:
    """Check if a character should use the Latin/fallback font"""
    code = ord(char)
    # Basic Latin (0x0000-0x007F), Latin-1 Supplement (0x0080-0x00FF), 
    # Latin Extended-A (0x0100-0x017F), Latin Extended-B (0x0180-0x024F)
    # Also include General Punctuation (0x2000-0x206F) for bullets, dashes etc.
    # And common symbols
    if code < 0x0250:  # Basic Latin and extensions
        return True
    if 0x2000 <= code <= 0x206F:  # General Punctuation (includes bullet •)
        return True
    if char in '@._-:/•·–—…':  # Common punctuation and symbols
        return True
    return False


def render_text_to_image(text: str, font_path: Path, font_size: int = 24, 
                         text_color: tuple = (51, 51, 51), max_width: int = 1400,
                         language: str = "en") -> Image.Image:
    """Render text to an image using Pillow with proper font shaping and fallback"""
    max_width = int(max_width)
    
    # Load primary font (for the target language)
    try:
        primary_font = ImageFont.truetype(str(font_path), font_size)
    except Exception as e:
        logger.warning(f"Could not load font {font_path}: {e}, using default")
        primary_font = ImageFont.load_default()
    
    # Load fallback font for Latin characters (NotoSans)
    fallback_font_path = FONTS_DIR / "NotoSans-Regular.ttf"
    try:
        fallback_font = ImageFont.truetype(str(fallback_font_path), font_size)
    except Exception as e:
        logger.warning(f"Could not load fallback font: {e}")
        fallback_font = primary_font
    
    # Create a temporary image to measure text
    temp_img = Image.new('RGB', (1, 1), color='white')
    temp_draw = ImageDraw.Draw(temp_img)
    
    # Word wrap the text using primary font for measurement
    lines = []
    paragraphs = text.split('\n')
    
    for paragraph in paragraphs:
        if not paragraph.strip():
            lines.append('')
            continue
            
        words = paragraph.split(' ')
        current_line = ''
        
        for word in words:
            test_line = current_line + ' ' + word if current_line else word
            # Use fallback font for measurement if it contains Latin
            measure_font = fallback_font if any(is_latin_char(c) for c in test_line) else primary_font
            bbox = temp_draw.textbbox((0, 0), test_line, font=measure_font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
    
    if not lines:
        lines = ['']
    
    # Calculate image dimensions
    line_height = font_size + 12  # Increased for better spacing
    total_height = int(len(lines) * line_height + 20)
    
    # Create the actual image
    img = Image.new('RGB', (int(max_width + 40), total_height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw each line with mixed font support
    y = 10
    for line in lines:
        x = 20
        # Split line into segments by script type
        segments = []
        current_segment = ""
        current_is_latin = None
        
        for char in line:
            char_is_latin = is_latin_char(char)
            if current_is_latin is None:
                current_is_latin = char_is_latin
            
            if char_is_latin == current_is_latin:
                current_segment += char
            else:
                if current_segment:
                    segments.append((current_segment, current_is_latin))
                current_segment = char
                current_is_latin = char_is_latin
        
        if current_segment:
            segments.append((current_segment, current_is_latin))
        
        # Draw each segment with appropriate font
        for segment_text, is_latin in segments:
            font_to_use = fallback_font if is_latin else primary_font
            draw.text((x, y), segment_text, font=font_to_use, fill=text_color)
            bbox = draw.textbbox((x, y), segment_text, font=font_to_use)
            x = bbox[2]  # Move x to end of this segment
        
        y += line_height
    
    return img


def create_text_image_flowable(text: str, font_path: Path, font_size: int = 24,
                               text_color: tuple = (51, 51, 51), max_width: int = 480,
                               language: str = "en") -> RLImage:
    """Create a ReportLab Image flowable from rendered text"""
    # Render text to image with language for font fallback
    img = render_text_to_image(text, font_path, font_size, text_color, max_width * 3, language)  # 3x for quality
    
    # Save to bytes
    img_buffer = BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    # Create ReportLab image
    # Scale down to fit page width
    aspect_ratio = img.height / img.width
    target_width = max_width
    target_height = target_width * aspect_ratio
    
    return RLImage(img_buffer, width=target_width, height=target_height)


def generate_pdf_with_images(title: str, sections: list, language: str) -> bytes:
    """Generate PDF using image-based text rendering for complex scripts"""
    
    font_path = get_font_path(language)
    is_rtl = language in RTL_LANGUAGES
    
    # Create PDF buffer
    buffer = BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # Calculate content width in points (A4 width - margins)
    content_width = A4[0] - 40*mm  # ~170mm = ~480 points
    
    # Build content
    story = []
    
    # Title as image
    title_img = create_text_image_flowable(
        title, font_path, font_size=36, 
        text_color=(75, 0, 130), max_width=content_width,
        language=language
    )
    story.append(title_img)
    story.append(Spacer(1, 3*mm))
    
    # Branding (simple text - English)
    styles = getSampleStyleSheet()
    branding_style = ParagraphStyle(
        'Branding',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=HexColor('#666666'),
        alignment=1,
        spaceAfter=8*mm,
    )
    story.append(Paragraph(
        "TEC WORLD Worldwide (Pvt.) Ltd - 42 Years of Educational Excellence",
        branding_style
    ))
    
    # Horizontal line
    story.append(HRFlowable(
        width="100%",
        thickness=1,
        color=HexColor('#4B0082'),
        spaceAfter=8*mm,
        spaceBefore=2*mm
    ))
    
    # Sections
    for section in sections:
        heading = section.get('heading', '')
        content = section.get('content', '')
        
        # Section heading as image
        if heading:
            heading_img = create_text_image_flowable(
                heading, font_path, font_size=28,
                text_color=(46, 125, 50), max_width=content_width,
                language=language
            )
            story.append(heading_img)
            story.append(Spacer(1, 2*mm))
        
        # Section content as image
        if content:
            content_img = create_text_image_flowable(
                content, font_path, font_size=22,
                text_color=(51, 51, 51), max_width=content_width,
                language=language
            )
            story.append(content_img)
            story.append(Spacer(1, 4*mm))
    
    # Footer separator
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(
        width="100%",
        thickness=0.5,
        color=HexColor('#dddddd'),
        spaceAfter=4*mm,
    ))
    
    # Footer (English)
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=HexColor('#666666'),
        alignment=1,
        spaceBefore=10*mm,
    )
    story.append(Paragraph(
        "© 2025 TEC WORLD Worldwide. All rights reserved. | www.tecaikids.com",
        footer_style
    ))
    
    # Build PDF
    doc.build(story)
    
    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


def generate_pdf_with_reportlab(title: str, sections: list, language: str) -> bytes:
    """Generate PDF using ReportLab for simple scripts"""
    
    # Register font
    font_file = FONT_FILES.get(language, "NotoSans-Regular.ttf")
    font_path = FONTS_DIR / font_file
    font_name = f"CustomFont_{language}"
    
    if font_file.endswith('.ttc'):
        font_path = FONTS_DIR / "NotoSans-Regular.ttf"
        font_name = "CustomFont_fallback"
    
    try:
        if font_path.exists():
            pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
        else:
            font_name = "Helvetica"
    except Exception as e:
        logger.error(f"Font registration error: {e}")
        font_name = "Helvetica"
    
    is_rtl = language in RTL_LANGUAGES
    alignment = 2 if is_rtl else 0
    
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName=font_name,
        fontSize=18,
        textColor=HexColor('#4B0082'),
        alignment=1,
        spaceAfter=6*mm,
        leading=24,
    )
    
    branding_style = ParagraphStyle(
        'Branding',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=HexColor('#666666'),
        alignment=1,
        spaceAfter=8*mm,
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName=font_name,
        fontSize=13,
        textColor=HexColor('#2E7D32'),
        alignment=alignment,
        spaceAfter=3*mm,
        spaceBefore=5*mm,
        leading=18,
    )
    
    content_style = ParagraphStyle(
        'SectionContent',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=10,
        textColor=HexColor('#333333'),
        alignment=alignment,
        spaceAfter=4*mm,
        leading=16,
    )
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=HexColor('#666666'),
        alignment=1,
        spaceBefore=10*mm,
    )
    
    def escape_xml(text):
        if not text:
            return ""
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&#39;'))
    
    story = []
    
    safe_title = escape_xml(title)
    story.append(Paragraph(safe_title, title_style))
    
    story.append(Paragraph(
        "TEC WORLD Worldwide (Pvt.) Ltd - 42 Years of Educational Excellence",
        branding_style
    ))
    
    story.append(HRFlowable(
        width="100%",
        thickness=1,
        color=HexColor('#4B0082'),
        spaceAfter=8*mm,
        spaceBefore=2*mm
    ))
    
    for section in sections:
        heading = escape_xml(section.get('heading', ''))
        content = escape_xml(section.get('content', ''))
        content = content.replace('\n', '<br/>')
        
        story.append(Paragraph(heading, heading_style))
        story.append(Paragraph(content, content_style))
    
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(
        width="100%",
        thickness=0.5,
        color=HexColor('#dddddd'),
        spaceAfter=4*mm,
    ))
    
    story.append(Paragraph(
        "© 2025 TEC WORLD Worldwide. All rights reserved. | www.tecaikids.com",
        footer_style
    ))
    
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


async def generate_pdf_with_playwright(title: str, sections: list, language: str) -> bytes:
    """Generate PDF - uses image-based rendering for complex scripts, ReportLab for simple scripts"""
    
    if language in COMPLEX_SCRIPTS:
        # Use image-based rendering for Sinhala, Tamil, Hindi, Arabic, etc.
        logger.info(f"Using image-based PDF generation for {language}")
        return generate_pdf_with_images(title, sections, language)
    else:
        # Use ReportLab for English, Indonesian, Malay, Chinese
        logger.info(f"Using ReportLab PDF generation for {language}")
        return generate_pdf_with_reportlab(title, sections, language)


def generate_pdf_sync(title: str, sections: list, language: str) -> bytes:
    """Synchronous wrapper for PDF generation"""
    if language in COMPLEX_SCRIPTS:
        return generate_pdf_with_images(title, sections, language)
    else:
        return generate_pdf_with_reportlab(title, sections, language)
