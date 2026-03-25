"""Initial consolidated schema

Revision ID: consolidated_001
Revises: 
Create Date: 2026-03-24 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'consolidated_001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('last_name', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('reset_token', sa.String(length=255), nullable=True),
    sa.Column('reset_token_expires', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )

    # 2. programs
    op.create_table('programs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=200), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    # 3. curriculum_subjects
    op.create_table('curriculum_subjects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('program_id', sa.Integer(), nullable=False),
    sa.Column('semestre', sa.Integer(), nullable=False),
    sa.Column('clave', sa.String(length=30), nullable=False),
    sa.Column('nombre', sa.String(length=200), nullable=False),
    sa.ForeignKeyConstraint(['program_id'], ['programs.id'], name='fk_subjects_program'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_curriculum_subjects_program_id', 'curriculum_subjects', ['program_id'])
    op.create_index('ix_curriculum_subjects_semestre', 'curriculum_subjects', ['semestre'])

    # 4. curriculum_topics
    op.create_table('curriculum_topics',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('materia_id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=200), nullable=False),
    sa.ForeignKeyConstraint(['materia_id'], ['curriculum_subjects.id'], name='fk_topics_materia'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_curriculum_topics_materia_id', 'curriculum_topics', ['materia_id'])

    # 5. documents
    op.create_table('documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('file_type', sa.Enum('PDF', 'DOCX', 'TXT', 'PPTX', name='filetype'), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=True),
    sa.Column('is_complex', sa.Boolean(), server_default='0', nullable=False),
    sa.Column('content_text', mysql.LONGTEXT(), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus'), server_default='PENDING', nullable=False),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('uploaded_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_documents_user'),
    sa.PrimaryKeyConstraint('id')
    )

    # 6. generation_configs
    op.create_table('generation_configs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('program_id', sa.Integer(), nullable=False),
    sa.Column('subject_id', sa.Integer(), nullable=False),
    sa.Column('topic_id', sa.Integer(), nullable=False),
    sa.Column('subtopic', sa.String(length=150), nullable=True),
    sa.Column('question_type', sa.Enum('MCQ', 'TF', 'OPEN', 'MATCHING', 'CALCULATED', 'MIXED', name='questiontype'), nullable=False),
    sa.Column('difficulty', sa.Enum('EASY', 'MEDIUM', 'HARD', name='difficultylevel'), nullable=False),
    sa.Column('num_questions', sa.Integer(), nullable=False),
    sa.Column('num_mcq', sa.Integer(), server_default='0', nullable=False),
    sa.Column('num_matching', sa.Integer(), server_default='0', nullable=False),
    sa.Column('num_calculated', sa.Integer(), server_default='0', nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], name='fk_gen_document'),
    sa.ForeignKeyConstraint(['program_id'], ['programs.id'], name='fk_gen_program'),
    sa.ForeignKeyConstraint(['subject_id'], ['curriculum_subjects.id'], name='fk_gen_subject'),
    sa.ForeignKeyConstraint(['topic_id'], ['curriculum_topics.id'], name='fk_gen_topic'),
    sa.PrimaryKeyConstraint('id')
    )

    # 7. items
    op.create_table('items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('config_id', sa.Integer(), nullable=False),
    sa.Column('question_text', sa.Text(), nullable=False),
    sa.Column('name', sa.Text(), nullable=True),
    sa.Column('question_type', sa.Enum('MCQ', 'TF', 'OPEN', 'MATCHING', 'CALCULATED', 'MIXED', name='questiontype'), nullable=True),
    sa.Column('is_validated', sa.Boolean(), server_default='0', nullable=False),
    sa.Column('feedback_correct', sa.Text(), nullable=True),
    sa.Column('feedback_incorrect', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['config_id'], ['generation_configs.id'], name='fk_items_config'),
    sa.PrimaryKeyConstraint('id')
    )

    # 8. options
    op.create_table('options',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('option_text', sa.Text(), nullable=False),
    sa.Column('is_correct', sa.Boolean(), server_default='0', nullable=False),
    sa.Column('feedback', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['items.id'], name='fk_options_item'),
    sa.PrimaryKeyConstraint('id')
    )

    # 9. exports
    op.create_table('exports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('format', sa.Enum('GIFT', 'XML', name='exportformat'), nullable=False),
    sa.Column('file_path', sa.Text(), nullable=False),
    sa.Column('exported_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_exports_user'),
    sa.PrimaryKeyConstraint('id')
    )

    # 10. logs
    op.create_table('logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('event_type', sa.String(length=50), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_logs_user', ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )

    # --- Seed Data ---
    # Programs
    op.execute("INSERT INTO programs (id, nombre) VALUES (1, 'Licenciatura en Ingeniería de Software')")

    # Subjects
    subjects_table = sa.table('curriculum_subjects',
        sa.column('program_id', sa.Integer),
        sa.column('semestre', sa.Integer),
        sa.column('clave', sa.String),
        sa.column('nombre', sa.String),
    )
    
    malla = [
        (1, "MATLIS161-AS",  "Álgebra Intermedia"),
        (1, "MATLIS161-GA",  "Geometría Analítica"),
        (1, "MATLIS161-A",   "Algoritmia"),
        (1, "MATLIS161-FIS", "Fundamentos de Ingeniería de Software"),
        (1, "MATLIS161-RSU", "Responsabilidad Social Universitaria"),
        (2, "MATLIS162-AA",  "Álgebra Superior"),
        (2, "MATLIS162-CD",  "Cálculo Diferencial"),
        (2, "MATLIS162-PE",  "Programación Estructurada"),
        (2, "MATLIS162-MD",  "Matemáticas Discretas"),
        (2, "MATLIS162-CM",  "Cultura Maya"),
        (3, "MATLIS163-AL",  "Álgebra Lineal"),
        (3, "MATLIS163-CI",  "Cálculo Integral"),
        (3, "MATLIS163-POO", "Programación Orientada a Objetos"),
        (3, "MATLIS163-TC",  "Teoría de la Computación"),
        (3, "MATLIS164-AC",  "Arquitectura de Computadoras"),
        (3, "MATLIS163-TLP", "Teoría de Lenguajes de Programación"),
        (4, "MATLIS164-P",   "Probabilidad"),
        (4, "MATLIS164-DS",  "Diseño de Software"),
        (4, "MATLIS164-ED",  "Estructura de Datos"),
        (4, "MATLIS164-SO",  "Sistemas Operativos"),
        (5, "MATLIS165-IE",  "Inferencia Estadística"),
        (5, "MATLIS165-AS",  "Arquitectura de Software"),
        (5, "MATLIS165-CS",  "Construcción de Software"),
        (5, "MATLIS166-DBD", "Diseño de Bases de Datos"),
        (5, "MATLIS167-DAW", "Desarrollo de Aplicaciones Web"),
        (6, "MATLIS166-MS",  "Métricas de Software"),
        (6, "MATLIS166-AC",  "Aseguramiento de la Calidad del Software"),
        (6, "MATLIS166-RS",  "Requisitos de Software"),
        (6, "MATLIS164-IHC", "Interacción Humano Computadora"),
        (7, "MATLIS167-EIS", "Experimentación en Ingeniería de Software"),
        (7, "MATLIS167-VVS", "Verificación y Validación de Software"),
        (7, "MATLIS167-RC",  "Redes y Seguridad de Computadoras"),
        (7, "MATLIS169-IT",  "Innovación Tecnológica"),
        (8, "MATLIS168-AP1", "Administración de Proyectos I"),
        (8, "MATLIS168-MS",  "Mantenimiento de Software"),
        (8, "MATLIS168-SD",  "Sistemas Distribuidos"),
        (9, "MATLIS169-AP2", "Administración de Proyectos II"),
    ]
    
    op.bulk_insert(subjects_table, [
        {"program_id": 1, "semestre": sem, "clave": clave, "nombre": nombre}
        for sem, clave, nombre in malla
    ])


def downgrade() -> None:
    op.drop_table('logs')
    op.drop_table('exports')
    op.drop_table('options')
    op.drop_table('items')
    op.drop_table('generation_configs')
    op.drop_table('documents')
    op.drop_table('curriculum_topics')
    op.drop_table('curriculum_subjects')
    op.drop_table('programs')
    op.drop_table('users')
