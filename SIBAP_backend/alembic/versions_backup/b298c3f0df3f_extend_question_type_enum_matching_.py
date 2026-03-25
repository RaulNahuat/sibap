"""Extend question_type enum MATCHING CALCULATED MIXED

Revision ID: b298c3f0df3f
Revises: d3692cb95d7d
Create Date: 2026-03-22 16:48:58.348844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b298c3f0df3f'
down_revision: Union[str, Sequence[str], None] = 'd3692cb95d7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_ENUM = "ENUM('MCQ','TF','OPEN','MATCHING','CALCULATED','MIXED')"


def upgrade() -> None:
    # Extend question_type enum in generation_configs
    op.execute(
        f"ALTER TABLE generation_configs MODIFY COLUMN question_type {NEW_ENUM} NOT NULL"
    )
    # Extend question_type enum in items (nullable)
    op.execute(
        f"ALTER TABLE items MODIFY COLUMN question_type {NEW_ENUM} NULL"
    )


def downgrade() -> None:
    OLD_ENUM = "ENUM('MCQ','TF','OPEN')"
    op.execute(
        f"ALTER TABLE generation_configs MODIFY COLUMN question_type {OLD_ENUM} NOT NULL"
    )
    op.execute(
        f"ALTER TABLE items MODIFY COLUMN question_type {OLD_ENUM} NULL"
    )
