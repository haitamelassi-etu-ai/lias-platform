import json
from typing import Any

from sqlalchemy.orm import Session

from .. import models


def write_audit_log(
    db: Session,
    actor: models.User,
    *,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    entity_title: str | None = None,
    details: dict[str, Any] | None = None,
) -> models.AuditLog:
    log = models.AuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        actor_name=actor.full_name,
        actor_role=actor.role.value,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=entity_title,
        details=json.dumps(details, ensure_ascii=False) if details else None,
    )
    db.add(log)
    return log
