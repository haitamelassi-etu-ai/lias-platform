from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_optional_user, require_admin

router = APIRouter(prefix="/gallery", tags=["gallery"])


def _serialize(item: models.GalleryItem) -> schemas.GalleryItemRead:
    return schemas.GalleryItemRead(
        id=item.id,
        title=item.title,
        image_url=item.image_url,
        caption=item.caption,
        category=item.category,
        is_published=item.is_published,
        author_id=item.author_id,
        author_name=item.author.full_name if item.author else "LIAS",
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.GalleryItemRead])
def list_gallery_items(
    include_unpublished: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.GalleryItemRead]:
    query = (
        select(models.GalleryItem)
        .options(joinedload(models.GalleryItem.author))
        .order_by(models.GalleryItem.created_at.desc())
    )

    if include_unpublished:
        if not _is_admin(optional_user):
            raise HTTPException(status_code=403, detail="Admin role required")
    else:
        query = query.where(models.GalleryItem.is_published.is_(True))

    return [_serialize(item) for item in db.scalars(query).all()]


@router.post(
    "",
    response_model=schemas.GalleryItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_gallery_item(
    payload: schemas.GalleryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
) -> schemas.GalleryItemRead:
    item = models.GalleryItem(
        **payload.model_dump(),
        author_id=current_user.id,
    )
    db.add(item)
    db.commit()

    item = db.scalar(
        select(models.GalleryItem)
        .where(models.GalleryItem.id == item.id)
        .options(joinedload(models.GalleryItem.author))
    )
    return _serialize(item)


@router.put("/{item_id}", response_model=schemas.GalleryItemRead)
def update_gallery_item(
    item_id: int,
    payload: schemas.GalleryItemUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> schemas.GalleryItemRead:
    item = db.get(models.GalleryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    db.commit()

    item = db.scalar(
        select(models.GalleryItem)
        .where(models.GalleryItem.id == item.id)
        .options(joinedload(models.GalleryItem.author))
    )
    return _serialize(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> None:
    item = db.get(models.GalleryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Gallery item not found")

    db.delete(item)
    db.commit()
