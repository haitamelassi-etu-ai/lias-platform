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

    if not include_all:
        query = query.where(
            models.Publication.validation_status == models.ValidationStatus.VALIDATED
        )
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


@router.put("/{publication_id}", response_model=schemas.PublicationRead)
def update_publication(
    publication_id: int,
    payload: schemas.PublicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.PublicationRead:
    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    if (
        current_user.role != models.UserRole.ADMIN
        and publication.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(publication, field, value)

    if current_user.role != models.UserRole.ADMIN:
        publication.validation_status = models.ValidationStatus.PENDING

    db.commit()

    publication = db.scalar(
        select(models.Publication)
        .where(models.Publication.id == publication.id)
        .options(joinedload(models.Publication.owner), joinedload(models.Publication.axis))
    )
    return _serialize(publication)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(
    publication_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    publication = db.get(models.Publication, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    if (
        current_user.role != models.UserRole.ADMIN
        and publication.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(publication)
    db.commit()
