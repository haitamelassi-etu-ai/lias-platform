from __future__ import annotations

import argparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .core.database import SessionLocal


def _linked_records_count(db: Session, user_id: int) -> int:
    return (
        db.query(models.MemberProfile).filter(models.MemberProfile.user_id == user_id).count()
        + db.query(models.Publication).filter(models.Publication.owner_id == user_id).count()
        + db.query(models.Communication).filter(models.Communication.owner_id == user_id).count()
        + db.query(models.Project).filter(models.Project.created_by == user_id).count()
        + db.query(models.LabEvent).filter(models.LabEvent.created_by == user_id).count()
        + db.query(models.NewsItem).filter(models.NewsItem.author_id == user_id).count()
        + db.query(models.GalleryItem).filter(models.GalleryItem.author_id == user_id).count()
        + db.query(models.ValidationRecord).filter(models.ValidationRecord.submitted_by == user_id).count()
        + db.query(models.ValidationRecord).filter(models.ValidationRecord.reviewed_by == user_id).count()
        + db.query(models.Notification).filter(models.Notification.user_id == user_id).count()
    )


def cleanup_inactive_users(*, apply: bool = False, only_local_domain: bool = False) -> dict[str, int]:
    with SessionLocal() as db:
        query = select(models.User).where(models.User.is_active.is_(False))
        if only_local_domain:
            query = query.where(models.User.email.ilike("%@lias.local"))

        candidates = db.scalars(query.order_by(models.User.id)).all()

        deletable: list[models.User] = []
        kept = 0
        for user in candidates:
            links = _linked_records_count(db, user.id)
            if links == 0:
                deletable.append(user)
            else:
                kept += 1

        if apply:
            for user in deletable:
                db.delete(user)
            db.commit()
        else:
            db.rollback()

    return {
        "candidates": len(candidates),
        "deleted": len(deletable) if apply else 0,
        "deletable": len(deletable),
        "kept_with_links": kept,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Nettoie les utilisateurs inactifs sans relations de donnees "
            "(publications, projets, notifications, etc.)."
        )
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Applique la suppression. Sans ce flag, le script reste en mode simulation.",
    )
    parser.add_argument(
        "--only-local-domain",
        action="store_true",
        help="Cible uniquement les emails @lias.local.",
    )
    args = parser.parse_args()

    stats = cleanup_inactive_users(
        apply=args.apply,
        only_local_domain=args.only_local_domain,
    )

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] candidates={stats['candidates']}")
    print(f"[{mode}] deletable={stats['deletable']}")
    print(f"[{mode}] kept_with_links={stats['kept_with_links']}")
    if args.apply:
        print(f"[{mode}] deleted={stats['deleted']}")


if __name__ == "__main__":
    main()
