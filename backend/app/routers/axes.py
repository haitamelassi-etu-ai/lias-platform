from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.audit import write_audit_log
from ..core.database import get_db
from ..core.deps import require_admin

router = APIRouter(prefix="/axes", tags=["axes"])


@router.get("", response_model=list[schemas.ResearchAxisRead])
def list_axes(db: Session = Depends(get_db)) -> list[schemas.ResearchAxisRead]:
    axes = db.scalars(select(models.ResearchAxis).order_by(models.ResearchAxis.title)).all()
    return [schemas.ResearchAxisRead.model_validate(axis) for axis in axes]


@router.post(
    "",
    response_model=schemas.ResearchAxisRead,
    status_code=status.HTTP_201_CREATED,
)
def create_axis(
    payload: schemas.ResearchAxisCreate,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.ResearchAxisRead:
    existing = db.scalar(
        select(models.ResearchAxis).where(models.ResearchAxis.title == payload.title)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Research axis already exists")

    axis = models.ResearchAxis(**payload.model_dump())
    db.add(axis)
    db.flush()
    write_audit_log(
        db,
        current_admin,
        action="research_axis.created",
        entity_type="research_axis",
        entity_id=axis.id,
        entity_title=axis.title,
    )
    db.commit()
    db.refresh(axis)
    return schemas.ResearchAxisRead.model_validate(axis)


@router.put("/{axis_id}", response_model=schemas.ResearchAxisRead)
def update_axis(
    axis_id: int,
    payload: schemas.ResearchAxisUpdate,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.ResearchAxisRead:
    axis = db.get(models.ResearchAxis, axis_id)
    if axis is None:
        raise HTTPException(status_code=404, detail="Research axis not found")

    updates = payload.model_dump(exclude_unset=True)
    previous_title = axis.title
    for field, value in updates.items():
        setattr(axis, field, value)

    write_audit_log(
        db,
        current_admin,
        action="research_axis.updated",
        entity_type="research_axis",
        entity_id=axis.id,
        entity_title=axis.title,
        details={
            "previous_title": previous_title,
            "updated_fields": sorted(updates.keys()),
        },
    )
    db.commit()
    db.refresh(axis)
    return schemas.ResearchAxisRead.model_validate(axis)


@router.delete("/{axis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_axis(
    axis_id: int,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    axis = db.get(models.ResearchAxis, axis_id)
    if axis is None:
        raise HTTPException(status_code=404, detail="Research axis not found")
    write_audit_log(
        db,
        current_admin,
        action="research_axis.deleted",
        entity_type="research_axis",
        entity_id=axis.id,
        entity_title=axis.title,
    )
    db.delete(axis)
    db.commit()
