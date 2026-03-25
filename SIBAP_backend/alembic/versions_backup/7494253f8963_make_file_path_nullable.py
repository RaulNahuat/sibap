"""make_file_path_nullable

Revision ID: 7494253f8963
Revises: a8b9c0d1e2f3
Create Date: 2026-02-14 14:28:09.783736

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7494253f8963'
down_revision: Union[str, Sequence[str], None] = 'a8b9c0d1e2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make file_path nullable in documents table
    op.alter_column('documents', 'file_path',
                    existing_type=sa.String(length=500),
                    nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert file_path to not nullable
    op.alter_column('documents', 'file_path',
                    existing_type=sa.String(length=500),
                    nullable=False)
