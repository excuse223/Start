"""Add user management fields

Revision ID: 004_add_user_management_fields
Revises: 003_add_reports
Create Date: 2026-03-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_user_management_fields'
down_revision = '003_add_reports'
branch_labels = None
depends_on = None


def upgrade():
    """Add last_login to users table and unique index on employee_id"""

    # Add last_login timestamp column
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))

    # Create unique index to ensure one employee = one user
    op.create_index('idx_users_employee_id_unique', 'users', ['employee_id'], unique=True)


def downgrade():
    """Remove user management fields"""

    # Drop unique index
    op.drop_index('idx_users_employee_id_unique', table_name='users')

    # Drop column
    op.drop_column('users', 'last_login')
