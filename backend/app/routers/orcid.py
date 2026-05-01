from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user

router = APIRouter(prefix="/orcid", tags=["orcid"])

ORCID_BASE_URL = "https://pub.orcid.org/v3.0"


class OrcidImportRequest(BaseModel):
    orcid_id: str | None = None
    max_items: int = Field(default=20, ge=1, le=100)


def _orcid_headers() -> dict[str, str]:
    return {"Accept": "application/json"}


def _parse_works(works_payload: dict) -> list[schemas.OrcidWorkPreview]:
    results: list[schemas.OrcidWorkPreview] = []
    groups = works_payload.get("group", [])

    for group in groups:
        summaries = group.get("work-summary", [])
        if not summaries:
            continue

        summary = summaries[0]
        title = (
            summary.get("title", {})
            .get("title", {})
            .get("value", "Untitled work")
        )
        publication_type = summary.get("type", "OTHER")

        year = None
        publication_date = summary.get("publication-date") or {}
        year_payload = publication_date.get("year") or {}
        if year_payload.get("value"):
            try:
                year = int(year_payload["value"])
            except ValueError:
                year = None

        venue = (summary.get("journal-title") or {}).get("value")

        doi = None
        external_ids = summary.get("external-ids") or {}
        for external_id in external_ids.get("external-id", []):
            if (external_id.get("external-id-type") or "").lower() == "doi":
                doi = external_id.get("external-id-value")
                break

        results.append(
            schemas.OrcidWorkPreview(
                title=title,
                publication_type=publication_type,
                year=year,
                venue=venue,
                doi=doi,
            )
        )

    return results


def _fetch_orcid_profile(orcid_id: str) -> schemas.OrcidProfilePreview:
    person_url = f"{ORCID_BASE_URL}/{orcid_id}/person"
    works_url = f"{ORCID_BASE_URL}/{orcid_id}/works"

    try:
        with httpx.Client(timeout=15.0) as client:
            person_response = client.get(person_url, headers=_orcid_headers())
            works_response = client.get(works_url, headers=_orcid_headers())
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to contact ORCID service: {exc}",
        )

    if person_response.status_code == 404:
        raise HTTPException(status_code=404, detail="ORCID identifier not found")

    if person_response.status_code >= 400 or works_response.status_code >= 400:
        raise HTTPException(status_code=502, detail="ORCID service returned an error")

    person_payload = person_response.json()
    works_payload = works_response.json()

    name_payload = person_payload.get("name") or {}
    given = (name_payload.get("given-names") or {}).get("value")
    family = (name_payload.get("family-name") or {}).get("value")
    full_name = " ".join(part for part in [given, family] if part) or None

    biography = (person_payload.get("biography") or {}).get("content")
    works = _parse_works(works_payload)

    return schemas.OrcidProfilePreview(
        orcid_id=orcid_id,
        full_name=full_name,
        biography=biography,
        works=works,
    )


@router.get("/{orcid_id}/preview", response_model=schemas.OrcidProfilePreview)
def preview_orcid(orcid_id: str) -> schemas.OrcidProfilePreview:
    return _fetch_orcid_profile(orcid_id)


@router.post("/link", response_model=schemas.MemberProfileRead)
def link_orcid(
    payload: schemas.OrcidLinkRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.MemberProfileRead:
    _ = _fetch_orcid_profile(payload.orcid_id)

    profile = db.scalar(
        select(models.MemberProfile).where(models.MemberProfile.user_id == current_user.id)
    )
    if profile is None:
        profile = models.MemberProfile(user_id=current_user.id, laboratory="LIAS")
        db.add(profile)
        db.flush()

    profile.orcid_id = payload.orcid_id
    db.commit()

    axis_title = profile.research_axis.title if profile.research_axis else None
    return schemas.MemberProfileRead(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        photo_url=profile.photo_url,
        grade=profile.grade,
        specialty=profile.specialty,
        team=profile.team,
        biography=profile.biography,
        interests=profile.interests,
        external_links=profile.external_links,
        orcid_id=profile.orcid_id,
        laboratory=profile.laboratory,
        research_axis_id=profile.research_axis_id,
        research_axis_title=axis_title,
        updated_at=profile.updated_at,
    )


@router.post("/import-publications", response_model=schemas.OrcidImportResponse)
def import_publications_from_orcid(
    payload: OrcidImportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.OrcidImportResponse:
    profile = db.scalar(
        select(models.MemberProfile).where(models.MemberProfile.user_id == current_user.id)
    )
    if profile is None:
        profile = models.MemberProfile(user_id=current_user.id, laboratory="LIAS")
        db.add(profile)
        db.flush()

    orcid_id = payload.orcid_id or profile.orcid_id
    if not orcid_id:
        raise HTTPException(
            status_code=400,
            detail="No ORCID linked. Please link an ORCID first.",
        )

    orcid_profile = _fetch_orcid_profile(orcid_id)
    profile.orcid_id = orcid_id

    imported = 0
    skipped = 0

    existing_publications = db.scalars(
        select(models.Publication).where(models.Publication.owner_id == current_user.id)
    ).all()

    existing_keys = {
        (
            (publication.doi or "").strip().lower(),
            publication.title.strip().lower(),
            publication.year,
        )
        for publication in existing_publications
    }

    for work in orcid_profile.works[: payload.max_items]:
        publication_year = work.year or datetime.utcnow().year
        key = ((work.doi or "").strip().lower(), work.title.strip().lower(), publication_year)

        if key in existing_keys:
            skipped += 1
            continue

        publication = models.Publication(
            title=work.title,
            authors=current_user.full_name,
            publication_type=work.publication_type,
            year=publication_year,
            venue=work.venue,
            doi=work.doi,
            external_link=f"https://doi.org/{work.doi}" if work.doi else None,
            source="orcid",
            validation_status=models.ValidationStatus.PENDING,
            owner_id=current_user.id,
        )
        db.add(publication)
        existing_keys.add(key)
        imported += 1

    db.commit()

    return schemas.OrcidImportResponse(
        imported=imported,
        skipped=skipped,
        message="ORCID import completed",
    )
