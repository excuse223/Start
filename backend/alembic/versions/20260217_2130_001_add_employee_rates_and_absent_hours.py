"""add employee rates and absent hours

Revision ID: 001
Revises: 
Create Date: 2026-02-17 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add hourly_rate and overtime_rate columns to employees table
    op.add_column('employees', sa.Column('hourly_rate', sa.Float(), nullable=True))
    op.add_column('employees', sa.Column('overtime_rate', sa.Float(), nullable=True))
    
    # Add absent_hours column to work_logs table
    op.add_column('work_logs', sa.Column('absent_hours', sa.Numeric(precision=5, scale=2), nullable=True, server_default='0.0'))


def downgrade() -> None:
    # Remove absent_hours column from work_logs table
    op.drop_column('work_logs', 'absent_hours')
    
    # Remove hourly_rate and overtime_rate columns from employees table
    op.drop_column('employees', 'overtime_rate')
    op.drop_column('employees', 'hourly_rate')
