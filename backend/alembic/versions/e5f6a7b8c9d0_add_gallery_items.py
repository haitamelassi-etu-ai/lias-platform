"""add_gallery_items

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-14 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gallery_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gallery_items_id", "gallery_items", ["id"])
    op.create_index("ix_gallery_items_title", "gallery_items", ["title"])
    op.create_index("ix_gallery_items_author_id", "gallery_items", ["author_id"])


def downgrade() -> None:
    op.drop_index("ix_gallery_items_author_id", table_name="gallery_items")
    op.drop_index("ix_gallery_items_title", table_name="gallery_items")
    op.drop_index("ix_gallery_items_id", table_name="gallery_items")
    op.drop_table("gallery_items")
