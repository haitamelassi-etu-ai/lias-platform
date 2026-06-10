import hmac
from datetime import date, datetime

from fastapi import Header, HTTPException, Request
from sqlalchemy import Boolean, Date, DateTime, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.core.database import Base, engine
from app.main import app


IMPORT_TABLE_ORDER = (
    "research_axes",
    "users",
    "member_profiles",
    "projects",
    "publications",
    "communications",
    "lab_events",
    "news_items",
    "gallery_items",
    "validation_records",
    "publication_change_requests",
    "notifications",
    "password_reset_tokens",
    "audit_logs",
)


def _coerce_row(table_name: str, row: dict) -> dict:
    table = Base.metadata.tables[table_name]
    converted = {}
    for key, value in row.items():
        column = table.c.get(key)
        if column is None or value is None:
            converted[key] = value
        elif isinstance(column.type, Boolean):
            if isinstance(value, str):
                converted[key] = value.strip().lower() in {"1", "true", "yes", "on"}
            else:
                converted[key] = bool(value)
        elif isinstance(column.type, DateTime) and isinstance(value, str):
            converted[key] = datetime.fromisoformat(value)
        elif isinstance(column.type, Date) and isinstance(value, str):
            converted[key] = date.fromisoformat(value)
        else:
            converted[key] = value
    return converted


@app.post("/internal/import-sqlite")
async def import_sqlite_data(
    request: Request,
    x_lias_import_key: str = Header(default=""),
) -> dict[str, dict[str, int]]:
    if not hmac.compare_digest(x_lias_import_key, settings.secret_key):
        raise HTTPException(status_code=403, detail="Invalid import key")

    payload = await request.json()
    source_tables = payload.get("tables", {})
    imported: dict[str, int] = {}

    with engine.begin() as connection:
        for table_name in IMPORT_TABLE_ORDER:
            rows = source_tables.get(table_name, [])
            if not rows:
                imported[table_name] = 0
                continue

            table = Base.metadata.tables[table_name]
            values = [_coerce_row(table_name, row) for row in rows]
            statement = pg_insert(table).values(values)
            statement = statement.on_conflict_do_nothing(index_elements=[table.c.id])
            result = connection.execute(statement)
            imported[table_name] = result.rowcount

            connection.execute(
                text(
                    f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), "
                    f"COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM \"{table_name}\""
                )
            )

    return {"imported": imported}


__all__ = ["app"]
