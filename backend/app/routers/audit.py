from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import require_admin

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[schemas.AuditLogRead])
def list_audit_logs(
    action: str | None = None,
    entity_type: str | None = None,
    limit: int = Query(default=100, ge=1, le=300),
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[schemas.AuditLogRead]:
    query = select(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(limit)

    if action:
        query = query.where(models.AuditLog.action == action)
    if entity_type:
        query = query.where(models.AuditLog.entity_type == entity_type)

    return [schemas.AuditLogRead.model_validate(log) for log in db.scalars(query).all()]
