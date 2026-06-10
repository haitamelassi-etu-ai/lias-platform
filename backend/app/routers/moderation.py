import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.audit import write_audit_log
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


def _notification_for_decision(
    *,
    user_id: int,
    content_type: str,
    content_id: int,
    title: str,
    decision: models.ValidationStatus,
    comment: str | None,
) -> models.Notification:
    labels = {
        models.ValidationStatus.VALIDATED: ("Contenu validé", "success"),
        models.ValidationStatus.REJECTED: ("Contenu rejeté", "danger"),
        models.ValidationStatus.NEEDS_CORRECTION: ("Correction demandée", "warning"),
        models.ValidationStatus.PENDING: ("Contenu en attente", "info"),
    }
    notification_title, category = labels[decision]
    message = f"{notification_title} : {title}"
    if comment:
        message = f"{message}. Commentaire admin : {comment}"

    return models.Notification(
        user_id=user_id,
        title=notification_title,
        message=message,
        category=category,
        content_type=content_type,
        content_id=content_id,
    )


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


@router.get("/change-requests", response_model=list[schemas.PublicationChangeRequestRead])
def list_change_requests(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> list[schemas.PublicationChangeRequestRead]:
    requests = db.scalars(
        select(models.PublicationChangeRequest)
        .where(models.PublicationChangeRequest.status == models.ChangeRequestStatus.PENDING)
        .order_by(models.PublicationChangeRequest.created_at.desc())
    ).all()

    result = []
    for req in requests:
        pub = db.get(models.Publication, req.publication_id)
        owner = db.get(models.User, req.owner_id)
        result.append(schemas.PublicationChangeRequestRead(
            id=req.id,
            publication_id=req.publication_id,
            publication_title=pub.title if pub else "Publication supprimée",
            owner_id=req.owner_id,
            owner_name=owner.full_name if owner else "Utilisateur inconnu",
            request_type=req.request_type.value,
            new_data=req.new_data,
            status=req.status.value,
            admin_comment=req.admin_comment,
            created_at=req.created_at,
        ))
    return result


@router.post("/change-requests/{request_id}/decision")
def decide_change_request(
    request_id: int,
    payload: schemas.ChangeRequestDecision,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
) -> dict[str, str]:
    req = db.get(models.PublicationChangeRequest, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if req.status != models.ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée")

    req.reviewed_at = datetime.utcnow()
    req.admin_comment = payload.comment
    publication = db.get(models.Publication, req.publication_id)

    if payload.decision == "approved":
        req.status = models.ChangeRequestStatus.APPROVED
        if publication is None:
            raise HTTPException(status_code=404, detail="Publication introuvable")

        if req.request_type == models.ChangeRequestType.DELETE:
            publication.is_archived = True
        elif req.request_type == models.ChangeRequestType.EDIT and req.new_data:
            new_fields = json.loads(req.new_data)
            for field, value in new_fields.items():
                if hasattr(publication, field):
                    setattr(publication, field, value)
            publication.validation_status = models.ValidationStatus.VALIDATED
    else:
        req.status = models.ChangeRequestStatus.REJECTED

    request_label = "suppression" if req.request_type == models.ChangeRequestType.DELETE else "modification"
    status_label = "approuvée" if payload.decision == "approved" else "rejetée"
    message = f"Votre demande de {request_label} a été {status_label}."
    if payload.comment:
        message = f"{message} Commentaire admin : {payload.comment}"
    db.add(
        models.Notification(
            user_id=req.owner_id,
            title=f"Demande {status_label}",
            message=f"{message} Publication : {publication.title if publication else 'Publication supprimée'}",
            category="success" if payload.decision == "approved" else "danger",
            content_type="publication_change_request",
            content_id=req.id,
        )
    )
    write_audit_log(
        db,
        current_admin,
        action=f"publication_change_request.{req.status.value}",
        entity_type="publication_change_request",
        entity_id=req.id,
        entity_title=publication.title if publication else "Publication supprimee",
        details={
            "publication_id": req.publication_id,
            "request_type": req.request_type.value,
            "decision": payload.decision,
            "comment": payload.comment,
            "owner_id": req.owner_id,
        },
    )

    db.commit()
    return {"message": "Décision enregistrée"}


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
    db.add(
        _notification_for_decision(
            user_id=validation.submitted_by,
            content_type=content_type,
            content_id=item_id,
            title=_title_for_item(content_type, item),
            decision=payload.decision,
            comment=payload.comment,
        )
    )
    write_audit_log(
        db,
        current_admin,
        action=f"moderation.{payload.decision.value}",
        entity_type=content_type,
        entity_id=item_id,
        entity_title=_title_for_item(content_type, item),
        details={
            "decision": payload.decision.value,
            "comment": payload.comment,
            "submitted_by": validation.submitted_by,
        },
    )
    db.commit()

    return {"message": "Décision enregistrée"}
