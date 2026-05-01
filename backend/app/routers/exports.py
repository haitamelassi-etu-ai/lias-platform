import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..core.database import get_db
from ..core.deps import get_current_active_user

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("/my-publications.csv")
def export_my_publications_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> StreamingResponse:
    publications = db.scalars(
        select(models.Publication)
        .where(models.Publication.owner_id == current_user.id)
        .order_by(models.Publication.year.desc(), models.Publication.created_at.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Title",
            "Authors",
            "Type",
            "Year",
            "Venue",
            "DOI",
            "Status",
            "Source",
        ]
    )

    for publication in publications:
        writer.writerow(
            [
                publication.id,
                publication.title,
                publication.authors,
                publication.publication_type,
                publication.year,
                publication.venue or "",
                publication.doi or "",
                publication.validation_status.value,
                publication.source,
            ]
        )

    output.seek(0)
    headers = {
        "Content-Disposition": "attachment; filename=my-publications.csv",
    }
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers,
    )
