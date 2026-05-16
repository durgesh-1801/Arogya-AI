"""
POST /api/explain — plain-language explanations for parsed lab parameters.

Gemini does NOT parse reports; it only explains structured data from the backend.
"""

import logging

from fastapi import APIRouter, HTTPException

from schemas.explain_schema import ExplainRequest, ExplainResponse
from services.llm_service import explain_parameters

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
async def explain_lab_parameters(body: ExplainRequest) -> ExplainResponse:
    """
    Explain already-parsed lab parameters in patient-friendly language.

    Flow:
      1. Validate request (parameters + language)
      2. Call Gemini (or template fallback on failure)
      3. Return urgency overview + per-parameter explanations
    """
    if not body.parameters:
        raise HTTPException(status_code=400, detail="At least one parameter is required")

    print("Explain request language:", body.language, "| stage: route/explain.py")
    print("  -> language repr:", repr(body.language), "type:", type(body.language).__name__)
    logger.info(
        "Explain request: %d parameter(s), language=%s (repr=%r)",
        len(body.parameters),
        body.language,
        body.language,
    )

    try:
        result = explain_parameters(body.parameters, body.language)
        print(
            "Explain request language:",
            body.language,
            "| stage: route/response",
            "| used_fallback:",
            result.used_fallback,
        )
    except Exception as exc:
        logger.exception("Unexpected error in explain_parameters")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanations: {exc}",
        ) from exc

    if result.used_fallback:
        logger.info("Explain response served via fallback templates")

    return result
