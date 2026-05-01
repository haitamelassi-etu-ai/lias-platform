from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
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
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.ResearchAxisRead:
    existing = db.scalar(
        select(models.ResearchAxis).where(models.ResearchAxis.title == payload.title)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Research axis already exists")

    axis = models.ResearchAxis(**payload.model_dump())
    db.add(axis)
    db.commit()
    db.refresh(axis)
    return schemas.ResearchAxisRead.model_validate(axis)


@router.put("/{axis_id}", response_model=schemas.ResearchAxisRead)
def update_axis(
    axis_id: int,
    payload: schemas.ResearchAxisUpdate,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.ResearchAxisRead:
    axis = db.get(models.ResearchAxis, axis_id)
    if axis is None:
        raise HTTPException(status_code=404, detail="Research axis not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(axis, field, value)

    db.commit()
    db.refresh(axis)
    return schemas.ResearchAxisRead.model_validate(axis)


@router.delete("/{axis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_axis(
    axis_id: int,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    axis = db.get(models.ResearchAxis, axis_id)
    if axis is None:
        raise HTTPException(status_code=404, detail="Research axis not found")
    db.delete(axis)
    db.commit()
