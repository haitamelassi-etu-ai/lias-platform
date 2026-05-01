from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_optional_user

router = APIRouter(prefix="/events", tags=["events"])


def _serialize(event: models.LabEvent) -> schemas.LabEventRead:
    return schemas.LabEventRead(
        id=event.id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        program=event.program,
        speakers=event.speakers,
        visual_url=event.visual_url,
        lifecycle_status=event.lifecycle_status,
        registration_link=event.registration_link,
        is_public=event.is_public,
        axis_id=event.axis_id,
        validation_status=event.validation_status,
        created_by=event.created_by,
        owner_name=event.owner.full_name,
        axis_title=event.axis.title if event.axis else None,
        created_at=event.created_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.LabEventRead])
def list_events(
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.LabEventRead]:
    query = (
        select(models.LabEvent)
        .options(joinedload(models.LabEvent.owner), joinedload(models.LabEvent.axis))
        .order_by(models.LabEvent.start_date.desc())
    )

    if not include_all:
        query = query.where(models.LabEvent.is_public.is_(True)).where(
            models.LabEvent.validation_status == models.ValidationStatus.VALIDATED
        )
    elif not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    events = db.scalars(query).all()
    return [_serialize(event) for event in events]


@router.post("", response_model=schemas.LabEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: schemas.LabEventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.LabEventRead:
    event = models.LabEvent(
        **payload.model_dump(),
        created_by=current_user.id,
        validation_status=models.ValidationStatus.PENDING,
    )
    db.add(event)
    db.commit()

    event = db.scalar(
        select(models.LabEvent)
        .where(models.LabEvent.id == event.id)
        .options(joinedload(models.LabEvent.owner), joinedload(models.LabEvent.axis))
    )
    return _serialize(event)


@router.put("/{event_id}", response_model=schemas.LabEventRead)
def update_event(
    event_id: int,
    payload: schemas.LabEventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.LabEventRead:
    event = db.get(models.LabEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role != models.UserRole.ADMIN and event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    if current_user.role != models.UserRole.ADMIN:
        event.validation_status = models.ValidationStatus.PENDING

    db.commit()

    event = db.scalar(
        select(models.LabEvent)
        .where(models.LabEvent.id == event.id)
        .options(joinedload(models.LabEvent.owner), joinedload(models.LabEvent.axis))
    )
    return _serialize(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    event = db.get(models.LabEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role != models.UserRole.ADMIN and event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(event)
    db.commit()
