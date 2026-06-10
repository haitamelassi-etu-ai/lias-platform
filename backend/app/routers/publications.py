import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_optional_user

router = APIRouter(prefix="/publications", tags=["publications"])


def _serialize(publication: models.Publication) -> schemas.PublicationRead:
    return schemas.PublicationRead(
        id=publication.id,
        title=publication.title,
        authors=publication.authors,
        publication_type=publication.publication_type,
        year=publication.year,
        venue=publication.venue,
        abstract=publication.abstract,
        keywords=publication.keywords,
        doi=publication.doi,
        external_link=publication.external_link,
        pdf_url=publication.pdf_url,
        axis_id=publication.axis_id,
        project_id=publication.project_id,
        source=publication.source,
        is_archived=publication.is_archived,
        validation_status=publication.validation_status,
        owner_id=publication.owner_id,
        owner_name=publication.owner.full_name,
        axis_title=publication.axis.title if publication.axis else None,
        created_at=publication.created_at,
        updated_at=publication.updated_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.PublicationRead])
def list_publications(
    search: str | None = None,
    year: int | None = None,
    axis_id: int | None = None,
    owner_id: int | None = None,
    publication_type: str | None = None,
    source: str | None = None,
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.PublicationRead]:
    query = (
        select(models.Publication)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
        .order_by(models.Publication.year.desc(), models.Publication.created_at.desc())
    )

    if search:
        normalized = f"%{search.strip()}%"
        query = query.where(
            (models.Publication.title.ilike(normalized))
            | (models.Publication.authors.ilike(normalized))
            | (models.Publication.abstract.ilike(normalized))
        )

    if year is not None:
        query = query.where(models.Publication.year == year)

    if axis_id is not None:
        query = query.where(models.Publication.axis_id == axis_id)

    if owner_id is not None:
        query = query.where(models.Publication.owner_id == owner_id)

    if publication_type:
        query = query.where(models.Publication.publication_type == publication_type)

    if source:
        query = query.where(models.Publication.source == source)

    if not include_all:
        query = query.where(
            models.Publication.validation_status == models.ValidationStatus.VALIDATED
        ).where(models.Publication.is_archived == False)  # noqa: E712
    elif not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    publications = db.scalars(query).all()
    return [_serialize(publication) for publication in publications]


@router.get("/me", response_model=list[schemas.PublicationRead])
def my_publications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.PublicationRead]:
    query = (
        select(models.Publication)
        .where(models.Publication.owner_id == current_user.id)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
        .order_by(models.Publication.year.desc(), models.Publication.created_at.desc())
    )
    return [_serialize(publication) for publication in db.scalars(query).all()]


@router.get("/{publication_id}", response_model=schemas.PublicationRead)
def get_publication(
    publication_id: int,
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> schemas.PublicationRead:
    publication = db.scalar(
        select(models.Publication)
        .where(models.Publication.id == publication_id)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
    )
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    can_view_private = include_all and _is_admin(optional_user)
    if not can_view_private and (
        publication.validation_status != models.ValidationStatus.VALIDATED
        or publication.is_archived
    ):
        raise HTTPException(status_code=404, detail="Publication not found")

    if include_all and not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    return _serialize(publication)


@router.post("", response_model=schemas.PublicationRead, status_code=status.HTTP_201_CREATED)
def create_publication(
    payload: schemas.PublicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.PublicationRead:
    publication = models.Publication(
        **payload.model_dump(),
        owner_id=current_user.id,
        validation_status=models.ValidationStatus.PENDING,
    )
    db.add(publication)
    db.commit()
    db.refresh(publication)

    publication = db.scalar(
        select(models.Publication)
        .where(models.Publication.id == publication.id)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
    )
    return _serialize(publication)


@router.post("/{publication_id}/request-edit", response_model=schemas.PublicationChangeRequestRead)
def request_edit_publication(
    publication_id: int,
    payload: schemas.PublicationEditRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.PublicationChangeRequestRead:
    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    if publication.owner_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if publication.source == "orcid":
        raise HTTPException(status_code=400, detail="Les publications importées depuis ORCID ne peuvent pas être modifiées")

    existing = db.scalar(
        select(models.PublicationChangeRequest).where(
            models.PublicationChangeRequest.publication_id == publication_id,
            models.PublicationChangeRequest.status == models.ChangeRequestStatus.PENDING,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Une demande est déjà en attente pour cette publication")

    change_request = models.PublicationChangeRequest(
        publication_id=publication_id,
        owner_id=current_user.id,
        request_type=models.ChangeRequestType.EDIT,
        new_data=json.dumps(payload.model_dump(exclude_none=True, exclude={"comment"})),
        status=models.ChangeRequestStatus.PENDING,
    )
    db.add(change_request)
    db.commit()
    db.refresh(change_request)

    return schemas.PublicationChangeRequestRead(
        id=change_request.id,
        publication_id=publication_id,
        publication_title=publication.title,
        owner_id=current_user.id,
        owner_name=current_user.full_name,
        request_type=change_request.request_type.value,
        new_data=change_request.new_data,
        status=change_request.status.value,
        admin_comment=None,
        created_at=change_request.created_at,
    )


@router.post("/{publication_id}/request-delete", response_model=schemas.PublicationChangeRequestRead)
def request_delete_publication(
    publication_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.PublicationChangeRequestRead:
    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    if publication.owner_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if publication.source == "orcid":
        raise HTTPException(status_code=400, detail="Les publications importées depuis ORCID ne peuvent pas être supprimées")

    existing = db.scalar(
        select(models.PublicationChangeRequest).where(
            models.PublicationChangeRequest.publication_id == publication_id,
            models.PublicationChangeRequest.request_type == models.ChangeRequestType.DELETE,
            models.PublicationChangeRequest.status == models.ChangeRequestStatus.PENDING,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Une demande de suppression est déjà en attente")

    change_request = models.PublicationChangeRequest(
        publication_id=publication_id,
        owner_id=current_user.id,
        request_type=models.ChangeRequestType.DELETE,
        status=models.ChangeRequestStatus.PENDING,
    )
    db.add(change_request)
    db.commit()
    db.refresh(change_request)

    return schemas.PublicationChangeRequestRead(
        id=change_request.id,
        publication_id=publication_id,
        publication_title=publication.title,
        owner_id=current_user.id,
        owner_name=current_user.full_name,
        request_type=change_request.request_type.value,
        new_data=None,
        status=change_request.status.value,
        admin_comment=None,
        created_at=change_request.created_at,
    )


@router.get("/me/change-requests", response_model=list[schemas.PublicationChangeRequestRead])
def my_change_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.PublicationChangeRequestRead]:
    requests = db.scalars(
        select(models.PublicationChangeRequest)
        .where(models.PublicationChangeRequest.owner_id == current_user.id)
        .order_by(models.PublicationChangeRequest.created_at.desc())
    ).all()

    result = []
    for req in requests:
        pub = db.get(models.Publication, req.publication_id)
        result.append(schemas.PublicationChangeRequestRead(
            id=req.id,
            publication_id=req.publication_id,
            publication_title=pub.title if pub else "Publication supprimée",
            owner_id=req.owner_id,
            owner_name=current_user.full_name,
            request_type=req.request_type.value,
            new_data=req.new_data,
            status=req.status.value,
            admin_comment=req.admin_comment,
            created_at=req.created_at,
        ))
    return result


@router.put("/{publication_id}", response_model=schemas.PublicationRead)
def update_publication_admin(
    publication_id: int,
    payload: schemas.PublicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.PublicationRead:
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin uniquement. Utilisez /request-edit pour soumettre une modification.")

    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(publication, field, value)
    db.commit()

    publication = db.scalar(
        select(models.Publication)
        .where(models.Publication.id == publication.id)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
    )
    return _serialize(publication)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication_admin(
    publication_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin uniquement. Utilisez /request-delete pour soumettre une demande de suppression.")

    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    db.delete(publication)
    db.commit()
