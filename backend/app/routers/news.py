from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_optional_user

router = APIRouter(prefix="/news", tags=["news"])


def _serialize(item: models.NewsItem) -> schemas.NewsItemRead:
    return schemas.NewsItemRead(
        id=item.id,
        title=item.title,
        content=item.content,
        category=item.category,
        image_url=item.image_url,
        is_published=item.is_published,
        validation_status=item.validation_status,
        author_id=item.author_id,
        author_name=item.author.full_name,
        published_at=item.published_at,
        created_at=item.created_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.NewsItemRead])
def list_news(
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.NewsItemRead]:
    query = (
        select(models.NewsItem)
        .options(joinedload(models.NewsItem.author))
        .order_by(models.NewsItem.created_at.desc())
    )

    if not include_all:
        query = query.where(models.NewsItem.is_published.is_(True)).where(
            models.NewsItem.validation_status == models.ValidationStatus.VALIDATED
        )
    elif not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    return [_serialize(item) for item in db.scalars(query).all()]


@router.post("", response_model=schemas.NewsItemRead, status_code=status.HTTP_201_CREATED)
def create_news(
    payload: schemas.NewsItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.NewsItemRead:
    item = models.NewsItem(
        **payload.model_dump(),
        author_id=current_user.id,
        validation_status=models.ValidationStatus.PENDING,
        published_at=datetime.utcnow() if payload.is_published else None,
    )
    db.add(item)
    db.commit()

    item = db.scalar(
        select(models.NewsItem)
        .where(models.NewsItem.id == item.id)
        .options(joinedload(models.NewsItem.author))
    )
    return _serialize(item)


@router.put("/{news_id}", response_model=schemas.NewsItemRead)
def update_news(
    news_id: int,
    payload: schemas.NewsItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.NewsItemRead:
    item = db.get(models.NewsItem, news_id)
    if item is None:
        raise HTTPException(status_code=404, detail="News item not found")

    if current_user.role != models.UserRole.ADMIN and item.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    if payload.is_published is True and item.published_at is None:
        item.published_at = datetime.utcnow()

    if current_user.role != models.UserRole.ADMIN:
        item.validation_status = models.ValidationStatus.PENDING

    db.commit()

    item = db.scalar(
        select(models.NewsItem)
        .where(models.NewsItem.id == item.id)
        .options(joinedload(models.NewsItem.author))
    )
    return _serialize(item)


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    item = db.get(models.NewsItem, news_id)
    if item is None:
        raise HTTPException(status_code=404, detail="News item not found")

    if current_user.role != models.UserRole.ADMIN and item.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(item)
    db.commit()
