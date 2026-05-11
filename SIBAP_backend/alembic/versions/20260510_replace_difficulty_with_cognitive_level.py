"""Replace difficulty with cognitive_level in generation_configs

Revision ID: bloom_001
Revises: async_gen_001
Create Date: 2026-05-10 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'bloom_001'
down_revision: Union[str, None] = 'async_gen_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar la nueva columna cognitive_level
    op.add_column('generation_configs',
        sa.Column('cognitive_level', sa.String(length=255), nullable=True)
    )
    # Eliminar la columna difficulty
    op.drop_column('generation_configs', 'difficulty')
    # Eliminar el tipo ENUM difficultylevel (MySQL lo elimina con la columna,
    # pero en PostgreSQL puede quedar huérfano — lo limpiamos por si acaso)
    # op.execute("DROP TYPE IF EXISTS difficultylevel")  # Descomentar si se usa PostgreSQL


def downgrade() -> None:
    # Recrear la columna difficulty con un valor por defecto para el rollback
    op.add_column('generation_configs',
        sa.Column(
            'difficulty',
            sa.Enum('EASY', 'MEDIUM', 'HARD', name='difficultylevel'),
            nullable=False,
            server_default='MEDIUM'
        )
    )
    op.drop_column('generation_configs', 'cognitive_level')
