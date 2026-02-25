"""normalize curriculum: extract programs table

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-02-22 18:34:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create programs table
    op.create_table(
        'programs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre'),
    )

    # 2. Insert existing programs (deduplicated from curriculum_subjects)
    op.execute("""
        INSERT INTO programs (nombre)
        SELECT DISTINCT programa FROM curriculum_subjects
        ORDER BY programa
    """)

    # 3. Add nullable program_id column to curriculum_subjects
    op.add_column(
        'curriculum_subjects',
        sa.Column('program_id', sa.Integer(), nullable=True)
    )

    # 4. Populate program_id from the new programs table
    op.execute("""
        UPDATE curriculum_subjects cs
        JOIN programs p ON cs.programa = p.nombre
        SET cs.program_id = p.id
    """)

    # 5. Make program_id NOT NULL using MySQL-native MODIFY COLUMN
    op.execute("ALTER TABLE curriculum_subjects MODIFY COLUMN program_id INT NOT NULL")

    op.create_foreign_key(
        'fk_curriculum_subjects_program_id',
        'curriculum_subjects', 'programs',
        ['program_id'], ['id']
    )
    op.create_index('ix_curriculum_subjects_program_id', 'curriculum_subjects', ['program_id'])

    # 6. Drop old string column and its index
    op.drop_index('ix_curriculum_subjects_programa', table_name='curriculum_subjects')
    op.drop_column('curriculum_subjects', 'programa')


def downgrade() -> None:
    # Re-add programa string column
    op.add_column(
        'curriculum_subjects',
        sa.Column('programa', sa.String(length=200), nullable=True)
    )

    # Restore data from programs table
    op.execute("""
        UPDATE curriculum_subjects cs
        JOIN programs p ON cs.program_id = p.id
        SET cs.programa = p.nombre
    """)

    op.alter_column('curriculum_subjects', 'programa', nullable=False)
    op.create_index('ix_curriculum_subjects_programa', 'curriculum_subjects', ['programa'])

    # Remove FK and program_id column
    op.drop_index('ix_curriculum_subjects_program_id', table_name='curriculum_subjects')
    op.drop_constraint('fk_curriculum_subjects_program_id', 'curriculum_subjects', type_='foreignkey')
    op.drop_column('curriculum_subjects', 'program_id')

    # Drop programs table
    op.drop_table('programs')
