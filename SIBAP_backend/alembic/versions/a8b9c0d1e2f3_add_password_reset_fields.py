"""add_password_reset_fields

Revision ID: a8b9c0d1e2f3
Revises: 501a647b1921
Create Date: 2026-02-14 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8b9c0d1e2f3'
down_revision: Union[str, None] = '501a647b1921'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add password reset fields to users table
    op.add_column('users', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove password reset fields from users table
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
