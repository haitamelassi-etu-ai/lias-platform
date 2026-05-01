from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import require_admin

router = APIRouter(prefix="/moderation", tags=["moderation"])


def _content_map() -> dict[str, type]:
    return {
        "publication": models.Publication,
        "communication": models.Communication,
        "project": models.Project,
        "event": models.LabEvent,
        "news": models.NewsItem,
    }


def _title_for_item(content_type: str, item: object) -> str:
    if content_type == "news":
        return getattr(item, "title")
    return getattr(item, "title")


def _author_name_for_item(content_type: str, item: object, db: Session) -> str:
    if content_type in {"publication", "communication"}:
        user = db.get(models.User, getattr(item, "owner_id"))
    elif content_type in {"project", "event"}:
        user = db.get(models.User, getattr(item, "created_by"))
    else:
        user = db.get(models.User, getattr(item, "author_id"))

    return user.full_name if user else "Utilisateur inconnu"


def _submitted_by_for_item(content_type: str, item: object) -> int:
    if content_type in {"publication", "communication"}:
        return getattr(item, "owner_id")
    if content_type in {"project", "event"}:
        return getattr(item, "created_by")
    return getattr(item, "author_id")


@router.get("/queue", response_model=list[schemas.ModerationQueueItem])
def moderation_queue(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> list[schemas.ModerationQueueItem]:
    queue: list[schemas.ModerationQueueItem] = []

    for content_type, model in _content_map().items():
        items = db.scalars(
            select(model)
            .where(model.validation_status == models.ValidationStatus.PENDING)
            .order_by(model.created_at.desc())
        ).all()

        for item in items:
            queue.append(
                schemas.ModerationQueueItem(
                    content_type=content_type,
                    item_id=item.id,
                    title=_title_for_item(content_type, item),
                    author_name=_author_name_for_item(content_type, item, db),
                    created_at=item.created_at,
                    status=item.validation_status,
                )
            )

    queue.sort(key=lambda element: element.created_at, reverse=True)
    return queue


@router.post("/{content_type}/{item_id}/decision")
def moderation_decision(
    content_type: str,
    item_id: int,
    payload: schemas.ModerationDecisionRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
) -> dict[str, str]:
    model = _content_map().get(content_type)
    if model is None:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Content item not found")

    item.validation_status = payload.decision

    if content_type == "news" and payload.decision == models.ValidationStatus.VALIDATED:
        if getattr(item, "is_published", False) and getattr(item, "published_at") is None:
            item.published_at = datetime.utcnow()

    validation = models.ValidationRecord(
        content_type=content_type,
        content_id=item_id,
        decision=payload.decision,
        comment=payload.comment,
        submitted_by=_submitted_by_for_item(content_type, item),
        reviewed_by=current_admin.id,
    )
    db.add(validation)
    db.commit()

    return {"message": "Decision saved"}
