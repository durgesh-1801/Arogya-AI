"""Report parameter ORM model."""

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.session import Base


class ReportParameter(Base):
    __tablename__ = "report_parameters"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parameter_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    normal_min: Mapped[float] = mapped_column(Float, nullable=False)
    normal_max: Mapped[float] = mapped_column(Float, nullable=False)

    report: Mapped["MedicalReport"] = relationship(
        "MedicalReport", back_populates="parameters"
    )
