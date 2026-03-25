"""add status and error_message to generation_configs

Revision ID: async_gen_001
Revises: consolidated_001
Create Date: 2026-03-25 14:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'async_gen_001'
down_revision: Union[str, None] = 'consolidated_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Agregar columnas status y error_message
    op.add_column('generation_configs', 
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='generationstatus'), 
        server_default='PENDING', 
        nullable=False)
    )
    op.add_column('generation_configs', 
        sa.Column('error_message', sa.Text(), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('generation_configs', 'error_message')
    op.drop_column('generation_configs', 'status')
    # En MySQL el tipo ENUM se elimina con la columna si no es un tipo global (que aquí no lo es)
