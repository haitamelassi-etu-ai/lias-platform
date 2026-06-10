"""add_change_requests_and_orcid_oauth

Revision ID: b2c3d4e5f6a7
Revises: fa91dea888e7
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "fa91dea888e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("orcid_sub", sa.String(length=32), nullable=True))
    op.create_index("ix_users_orcid_sub", "users", ["orcid_sub"], unique=True)

    op.add_column("publications", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default="false"))

    op.create_table(
        "publication_change_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("publication_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column(
            "request_type",
            sa.Enum("edit", "delete", name="changerequesttype"),
            nullable=False,
        ),
        sa.Column("new_data", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="changerequeststatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("admin_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["publication_id"], ["publications.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_publication_change_requests_id", "publication_change_requests", ["id"])
    op.create_index("ix_publication_change_requests_publication_id", "publication_change_requests", ["publication_id"])
    op.create_index("ix_publication_change_requests_owner_id", "publication_change_requests", ["owner_id"])
    op.create_index("ix_publication_change_requests_status", "publication_change_requests", ["status"])


def downgrade() -> None:
    op.drop_table("publication_change_requests")
    op.drop_index("ix_users_orcid_sub", table_name="users")
    op.drop_column("users", "orcid_sub")
    op.drop_column("publications", "is_archived")
