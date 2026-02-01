"""
Certificate Generation Service for TecaiKids Educational Platform
Generates PDF certificates for course completion
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from io import BytesIO
from pathlib import Path
from pydantic import BaseModel, Field

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER
import logging

class Certificate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    student_name: str
    course_id: str
    course_title: str
    completion_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    certificate_type: str = "course_completion"  # course_completion, achievement, participation
    grade: Optional[str] = None  # A, B, C, Pass, etc.
    instructor_name: Optional[str] = None
    learning_level: str = "development"
    pdf_url: Optional[str] = None
    verification_code: str = Field(default_factory=lambda: uuid.uuid4().hex[:12].upper())
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def generate_certificate_pdf(
    student_name: str,
    course_title: str,
    completion_date: datetime,
    verification_code: str,
    instructor_name: Optional[str] = None,
    grade: Optional[str] = None,
    certificate_type: str = "course_completion"
) -> BytesIO:
    """Generate a PDF certificate"""
    
    # Register Unicode fonts
    fonts_dir = Path(__file__).parent / "fonts"
    font_registered = False
    
    try:
        noto_path = fonts_dir / "NotoSans-Regular.ttf"
        if noto_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSans', str(noto_path)))
            font_registered = True
        
        # Register additional fonts for multilingual support
        sinhala_path = fonts_dir / "NotoSansSinhala-Regular.ttf"
        if sinhala_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansSinhala', str(sinhala_path)))
        
        tamil_path = fonts_dir / "NotoSansTamil-Regular.ttf"
        if tamil_path.exists():
            pdfmetrics.registerFont(TTFont('NotoSansTamil', str(tamil_path)))
    except Exception as e:
        logging.warning(f"Font registration warning: {e}")
    
    default_font = 'NotoSans' if font_registered else 'Helvetica'
    bold_font = 'Helvetica-Bold'
    
    buffer = BytesIO()
    
    # Create document with landscape orientation
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=50,
        leftMargin=50,
        topMargin=30,
        bottomMargin=30
    )
    
    # Create styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontSize=36,
        textColor=colors.HexColor('#667eea'),
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName=bold_font
    )
    
    subtitle_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER,
        spaceAfter=30,
        fontName=default_font
    )
    
    name_style = ParagraphStyle(
        'StudentName',
        parent=styles['Heading2'],
        fontSize=28,
        textColor=colors.HexColor('#1e293b'),
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName=default_font
    )
    
    course_style = ParagraphStyle(
        'CourseName',
        parent=styles['Normal'],
        fontSize=18,
        textColor=colors.HexColor('#667eea'),
        alignment=TA_CENTER,
        spaceAfter=15,
        fontName=default_font
    )
    
    text_style = ParagraphStyle(
        'CertText',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_CENTER,
        spaceAfter=10,
        fontName=default_font
    )
    
    small_style = ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER,
        fontName=default_font
    )
    
    # Build content
    content = []
    
    # Header with TEC branding (removed emojis - they cause boxes)
    content.append(Paragraph("*** TEC Future-Ready Learning Platform ***", subtitle_style))
    content.append(Spacer(1, 20))
    
    # Certificate title
    cert_title = "Certificate of Completion"
    if certificate_type == "achievement":
        cert_title = "Certificate of Achievement"
    elif certificate_type == "participation":
        cert_title = "Certificate of Participation"
    
    content.append(Paragraph(cert_title, title_style))
    content.append(Spacer(1, 10))
    
    # "This is to certify that"
    content.append(Paragraph("This is to certify that", text_style))
    content.append(Spacer(1, 10))
    
    # Student name (prominent)
    content.append(Paragraph(student_name, name_style))
    content.append(Spacer(1, 10))
    
    # "has successfully completed"
    content.append(Paragraph("has successfully completed the course", text_style))
    content.append(Spacer(1, 10))
    
    # Course title
    content.append(Paragraph(f"<b>{course_title}</b>", course_style))
    content.append(Spacer(1, 20))
    
    # Grade if provided
    if grade:
        grade_text = f"with grade: <b>{grade}</b>"
        content.append(Paragraph(grade_text, text_style))
        content.append(Spacer(1, 10))
    
    # Date
    date_str = completion_date.strftime("%B %d, %Y")
    content.append(Paragraph(f"Completed on: {date_str}", text_style))
    content.append(Spacer(1, 30))
    
    # Instructor signature if provided
    if instructor_name:
        content.append(Paragraph("_" * 40, text_style))
        content.append(Paragraph(instructor_name, text_style))
        content.append(Paragraph("Course Instructor", small_style))
        content.append(Spacer(1, 20))
    
    # Verification code
    content.append(Spacer(1, 30))
    content.append(Paragraph(f"Verification Code: {verification_code}", small_style))
    content.append(Paragraph("Verify at www.tecaikids.com/verify", small_style))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    return buffer

async def create_and_save_certificate(
    student_id: str,
    student_name: str,
    course_id: str,
    course_title: str,
    instructor_name: Optional[str] = None,
    grade: Optional[str] = None,
    learning_level: str = "development"
) -> Certificate:
    """Create a certificate and save it"""
    
    cert = Certificate(
        student_id=student_id,
        student_name=student_name,
        course_id=course_id,
        course_title=course_title,
        instructor_name=instructor_name,
        grade=grade,
        learning_level=learning_level
    )
    
    return cert
