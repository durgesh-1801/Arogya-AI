"""Patient ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.session import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    reports: Mapped[list["MedicalReport"]] = relationship(
        "MedicalReport",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="MedicalReport.report_date",
    )
