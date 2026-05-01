from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_optional_user

router = APIRouter(prefix="/communications", tags=["communications"])


def _serialize(communication: models.Communication) -> schemas.CommunicationRead:
    return schemas.CommunicationRead(
        id=communication.id,
        title=communication.title,
        authors=communication.authors,
        event_name=communication.event_name,
        communication_type=communication.communication_type,
        location=communication.location,
        country=communication.country,
        event_date=communication.event_date,
        abstract=communication.abstract,
        presentation_status=communication.presentation_status,
        document_url=communication.document_url,
        axis_id=communication.axis_id,
        validation_status=communication.validation_status,
        owner_id=communication.owner_id,
        owner_name=communication.owner.full_name,
        axis_title=communication.axis.title if communication.axis else None,
        created_at=communication.created_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.CommunicationRead])
def list_communications(
    year: int | None = None,
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.CommunicationRead]:
    query = (
        select(models.Communication)
        .options(joinedload(models.Communication.owner), joinedload(models.Communication.axis))
        .order_by(models.Communication.created_at.desc())
    )

    if year is not None:
        start = date(year, 1, 1)
        end = date(year, 12, 31)
        query = query.where(models.Communication.event_date.is_not(None))
        query = query.where(models.Communication.event_date >= start)
        query = query.where(models.Communication.event_date <= end)

    if not include_all:
        query = query.where(
            models.Communication.validation_status == models.ValidationStatus.VALIDATED
        )
    elif not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    return [_serialize(item) for item in db.scalars(query).all()]


@router.get("/me", response_model=list[schemas.CommunicationRead])
def my_communications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.CommunicationRead]:
    query = (
        select(models.Communication)
        .where(models.Communication.owner_id == current_user.id)
        .options(joinedload(models.Communication.owner), joinedload(models.Communication.axis))
        .order_by(models.Communication.created_at.desc())
    )
    return [_serialize(item) for item in db.scalars(query).all()]


@router.post(
    "",
    response_model=schemas.CommunicationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_communication(
    payload: schemas.CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.CommunicationRead:
    communication = models.Communication(
        **payload.model_dump(),
        owner_id=current_user.id,
        validation_status=models.ValidationStatus.PENDING,
    )
    db.add(communication)
    db.commit()

    communication = db.scalar(
        select(models.Communication)
        .where(models.Communication.id == communication.id)
        .options(joinedload(models.Communication.owner), joinedload(models.Communication.axis))
    )
    return _serialize(communication)


@router.put("/{communication_id}", response_model=schemas.CommunicationRead)
def update_communication(
    communication_id: int,
    payload: schemas.CommunicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.CommunicationRead:
    communication = db.get(models.Communication, communication_id)
    if communication is None:
        raise HTTPException(status_code=404, detail="Communication not found")

    if (
        current_user.role != models.UserRole.ADMIN
        and communication.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(communication, field, value)

    if current_user.role != models.UserRole.ADMIN:
        communication.validation_status = models.ValidationStatus.PENDING

    db.commit()

    communication = db.scalar(
        select(models.Communication)
        .where(models.Communication.id == communication.id)
        .options(joinedload(models.Communication.owner), joinedload(models.Communication.axis))
    )
    return _serialize(communication)


@router.delete("/{communication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_communication(
    communication_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    communication = db.get(models.Communication, communication_id)
    if communication is None:
        raise HTTPException(status_code=404, detail="Communication not found")

    if (
        current_user.role != models.UserRole.ADMIN
        and communication.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(communication)
    db.commit()
