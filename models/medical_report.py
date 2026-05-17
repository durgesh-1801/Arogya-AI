"""Medical report ORM model."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.session import Base


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    report_date: Mapped[date] = mapped_column(Date, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency_level: Mapped[str] = mapped_column(String(32), default="low", nullable=False)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="reports")
    parameters: Mapped[list["ReportParameter"]] = relationship(
        "ReportParameter",
        back_populates="report",
        cascade="all, delete-orphan",
    )
