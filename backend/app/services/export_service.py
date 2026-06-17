"""
PDF report export using ReportLab.
Generates a clean, styled interview performance report.
"""
import io
from datetime import datetime
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.session import InterviewSession, InterviewQuestion
from app.models.attempt import InterviewAttempt
from app.services.evaluation_service import EvaluationService


# Brand colors
PRIMARY = colors.HexColor("#6366f1")     # Indigo
SECONDARY = colors.HexColor("#8b5cf6")   # Purple
SUCCESS = colors.HexColor("#10b981")     # Green
WARNING = colors.HexColor("#f59e0b")     # Amber
DANGER = colors.HexColor("#ef4444")      # Red
DARK = colors.HexColor("#1e1b4b")        # Dark indigo
LIGHT_BG = colors.HexColor("#f8fafc")    # Light gray
BORDER = colors.HexColor("#e2e8f0")


def _score_color(score: float) -> colors.Color:
    if score >= 7.5:
        return SUCCESS
    elif score >= 5.0:
        return WARNING
    return DANGER


class ExportService:

    @staticmethod
    async def generate_pdf(session_id: int, user_id: int, db: AsyncSession) -> bytes:
        # Fetch session summary
        summary = await EvaluationService.get_session_summary(session_id, user_id, db)

        # Fetch question texts
        q_result = await db.execute(
            select(InterviewQuestion)
            .where(InterviewQuestion.session_id == session_id)
            .order_by(InterviewQuestion.order_index)
        )
        questions = {q.id: q for q in q_result.scalars().all()}

        # Build PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )

        styles = getSampleStyleSheet()
        story = []

        # ── Header ──────────────────────────────────────────────
        header_style = ParagraphStyle(
            "Header",
            fontSize=24,
            textColor=DARK,
            spaceAfter=4,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        )
        sub_style = ParagraphStyle(
            "Sub",
            fontSize=12,
            textColor=colors.gray,
            spaceAfter=2,
            alignment=TA_CENTER,
        )

        story.append(Paragraph("Interview Performance Report", header_style))
        story.append(Paragraph("Interview Preparation AI Coach", sub_style))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", sub_style))
        story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=12))

        # ── Session Info ─────────────────────────────────────────
        section_style = ParagraphStyle(
            "Section",
            fontSize=14,
            textColor=DARK,
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=6,
        )
        normal = ParagraphStyle("N", fontSize=10, textColor=colors.black, spaceAfter=3)

        story.append(Paragraph("Session Overview", section_style))
        info_data = [
            ["Target Role", summary.role, "Difficulty", summary.difficulty.upper()],
            ["Questions", str(summary.total_questions), "Answered", str(summary.answered)],
            ["Overall Score", f"{summary.avg_score:.1f}/10", "Session ID", f"#{summary.session_id}"],
        ]
        info_table = Table(info_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_BG),
            ("BACKGROUND", (2, 0), (2, -1), LIGHT_BG),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUND", (0, 0), (-1, -1), [colors.white, LIGHT_BG]),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 12))

        # ── Score Summary ────────────────────────────────────────
        story.append(Paragraph("Score Breakdown", section_style))
        score_data = [
            ["Dimension", "Score", "Rating"],
            ["Technical Correctness", f"{summary.avg_correctness:.1f}/10",
             "Good" if summary.avg_correctness >= 7 else "Needs Work"],
            ["Communication", f"{summary.avg_communication:.1f}/10",
             "Good" if summary.avg_communication >= 7 else "Needs Work"],
            ["Answer Relevance", f"{summary.avg_relevance:.1f}/10",
             "Good" if summary.avg_relevance >= 7 else "Needs Work"],
            ["OVERALL", f"{summary.avg_score:.1f}/10",
             "Strong" if summary.avg_score >= 7 else "Average" if summary.avg_score >= 5 else "Weak"],
        ]
        score_table = Table(score_data, colWidths=[7*cm, 4*cm, 6*cm])
        score_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), PRIMARY),
            ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUND", (0, 1), (-1, -2), [colors.white, LIGHT_BG]),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ]))
        story.append(score_table)
        story.append(Spacer(1, 12))

        # ── Weak / Strong areas ──────────────────────────────────
        if summary.weak_areas or summary.strong_areas:
            story.append(Paragraph("Areas Analysis", section_style))
            areas_data = [["Weak Areas", "Strong Areas"]]
            max_len = max(len(summary.weak_areas), len(summary.strong_areas), 1)
            for i in range(max_len):
                weak = summary.weak_areas[i] if i < len(summary.weak_areas) else ""
                strong = summary.strong_areas[i] if i < len(summary.strong_areas) else ""
                areas_data.append([f"⚠ {weak}" if weak else "", f"✓ {strong}" if strong else ""])
            areas_table = Table(areas_data, colWidths=[8.5*cm, 8.5*cm])
            areas_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("TEXTCOLOR", (0, 1), (0, -1), DANGER),
                ("TEXTCOLOR", (1, 1), (1, -1), SUCCESS),
            ]))
            story.append(areas_table)
            story.append(Spacer(1, 12))

        # ── Per-Question Details ─────────────────────────────────
        story.append(Paragraph("Detailed Question Analysis", section_style))

        q_title = ParagraphStyle("QTitle", fontSize=10, fontName="Helvetica-Bold",
                                  textColor=DARK, spaceBefore=8, spaceAfter=4)
        q_body = ParagraphStyle("QBody", fontSize=9, textColor=colors.black,
                                 spaceAfter=3, leftIndent=10)
        label_style = ParagraphStyle("Label", fontSize=8, fontName="Helvetica-Bold",
                                      textColor=colors.gray, spaceAfter=1, leftIndent=10)

        for i, attempt in enumerate(summary.attempts, 1):
            question = questions.get(attempt.question_id)
            q_text = question.question_text if question else "Question text unavailable"

            block = [
                Paragraph(f"Q{i}: {q_text}", q_title),
                Paragraph("Your Answer:", label_style),
                Paragraph(attempt.user_answer[:500], q_body),
                Paragraph(f"Score: {attempt.total_score:.1f}/10  |  "
                           f"Correctness: {attempt.correctness_score:.1f}  |  "
                           f"Communication: {attempt.communication_score:.1f}  |  "
                           f"Relevance: {attempt.relevance_score:.1f}", q_body),
                Paragraph("AI Feedback:", label_style),
                Paragraph(attempt.ai_evaluation[:400], q_body),
                Paragraph("Ideal Answer:", label_style),
                Paragraph(attempt.ideal_answer[:400], q_body),
            ]

            if attempt.improvements:
                block.append(Paragraph("Areas to Improve:", label_style))
                for imp in attempt.improvements[:3]:
                    block.append(Paragraph(f"• {imp}", q_body))

            story.append(KeepTogether(block))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))

        # ── Footer Note ──────────────────────────────────────────
        story.append(Spacer(1, 12))
        footer_style = ParagraphStyle("Footer", fontSize=8, textColor=colors.gray, alignment=TA_CENTER)
        story.append(Paragraph(
            "Generated by Interview Preparation AI Coach | Keep practicing to improve your scores!",
            footer_style
        ))

        doc.build(story)
        return buffer.getvalue()
