"""add curriculum subjects table

Revision ID: b1c2d3e4f5a6
Revises: a8b9c0d1e2f3
Create Date: 2026-02-22 18:16:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '2c137022172a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PROGRAMA_IS = "Licenciatura en Ingeniería de Software"

MALLA_IS = [
    # --- 1er Semestre ---
    (1, "MATLIS161-AS",  "Álgebra Intermedia"),
    (1, "MATLIS161-GA",  "Geometría Analítica"),
    (1, "MATLIS161-A",   "Algoritmia"),
    (1, "MATLIS161-FIS", "Fundamentos de Ingeniería de Software"),
    (1, "MATLIS161-RSU", "Responsabilidad Social Universitaria"),

    # --- 2do Semestre ---
    (2, "MATLIS162-AA",  "Álgebra Superior"),
    (2, "MATLIS162-CD",  "Cálculo Diferencial"),
    (2, "MATLIS162-PE",  "Programación Estructurada"),
    (2, "MATLIS162-MD",  "Matemáticas Discretas"),
    (2, "MATLIS162-CM",  "Cultura Maya"),

    # --- 3er Semestre ---
    (3, "MATLIS163-AL",  "Álgebra Lineal"),
    (3, "MATLIS163-CI",  "Cálculo Integral"),
    (3, "MATLIS163-POO", "Programación Orientada a Objetos"),
    (3, "MATLIS163-TC",  "Teoría de la Computación"),
    (3, "MATLIS164-AC",  "Arquitectura de Computadoras"),
    (3, "MATLIS163-TLP", "Teoría de Lenguajes de Programación"),

    # --- 4to Semestre ---
    (4, "MATLIS164-P",   "Probabilidad"),
    (4, "MATLIS164-DS",  "Diseño de Software"),
    (4, "MATLIS164-ED",  "Estructura de Datos"),
    (4, "MATLIS164-SO",  "Sistemas Operativos"),

    # --- 5to Semestre ---
    (5, "MATLIS165-IE",  "Inferencia Estadística"),
    (5, "MATLIS165-AS",  "Arquitectura de Software"),
    (5, "MATLIS165-CS",  "Construcción de Software"),
    (5, "MATLIS166-DBD", "Diseño de Bases de Datos"),
    (5, "MATLIS167-DAW", "Desarrollo de Aplicaciones Web"),

    # --- 6to Semestre ---
    (6, "MATLIS166-MS",  "Métricas de Software"),
    (6, "MATLIS166-AC",  "Aseguramiento de la Calidad del Software"),
    (6, "MATLIS166-RS",  "Requisitos de Software"),
    (6, "MATLIS164-IHC", "Interacción Humano Computadora"),

    # --- 7mo Semestre ---
    (7, "MATLIS167-EIS", "Experimentación en Ingeniería de Software"),
    (7, "MATLIS167-VVS", "Verificación y Validación de Software"),
    (7, "MATLIS167-RC",  "Redes y Seguridad de Computadoras"),
    (7, "MATLIS169-IT",  "Innovación Tecnológica"),

    # --- 8vo Semestre ---
    (8, "MATLIS168-AP1", "Administración de Proyectos I"),
    (8, "MATLIS168-MS",  "Mantenimiento de Software"),
    (8, "MATLIS168-SD",  "Sistemas Distribuidos"),

    # --- 9no Semestre ---
    (9, "MATLIS169-AP2", "Administración de Proyectos II"),
]


def upgrade() -> None:
    op.create_table(
        'curriculum_subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('programa', sa.String(length=200), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=False),
        sa.Column('clave', sa.String(length=30), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_curriculum_subjects_programa', 'curriculum_subjects', ['programa'])
    op.create_index('ix_curriculum_subjects_semestre', 'curriculum_subjects', ['semestre'])

    # Seed data
    op.bulk_insert(
        sa.table(
            'curriculum_subjects',
            sa.column('programa', sa.String),
            sa.column('semestre', sa.Integer),
            sa.column('clave', sa.String),
            sa.column('nombre', sa.String),
        ),
        [
            {"programa": PROGRAMA_IS, "semestre": sem, "clave": clave, "nombre": nombre}
            for sem, clave, nombre in MALLA_IS
        ]
    )


def downgrade() -> None:
    op.drop_index('ix_curriculum_subjects_semestre', table_name='curriculum_subjects')
    op.drop_index('ix_curriculum_subjects_programa', table_name='curriculum_subjects')
    op.drop_table('curriculum_subjects')
