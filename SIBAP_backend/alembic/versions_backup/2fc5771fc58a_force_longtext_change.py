"""force_longtext_change

Revision ID: 2fc5771fc58a
Revises: 7494253f8963
Create Date: 2026-02-14 15:17:47.803646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fc5771fc58a'
down_revision: Union[str, Sequence[str], None] = '7494253f8963'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Manual migration to change content_text to LONGTEXT
    from sqlalchemy.dialects import mysql
    op.alter_column('documents', 'content_text',
               existing_type=mysql.TEXT(),
               type_=mysql.LONGTEXT(),
               existing_nullable=False)


def downgrade() -> None:
    from sqlalchemy.dialects import mysql
    op.alter_column('documents', 'content_text',
               existing_type=mysql.LONGTEXT(),
               type_=mysql.TEXT(),
               existing_nullable=False)
