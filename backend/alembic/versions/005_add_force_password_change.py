"""Add force_password_change column to users

Revision ID: 005_add_force_password_change
Revises: 004_add_user_management_fields
Create Date: 2026-03-09 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_force_password_change'
down_revision = '004_add_user_management_fields'
branch_labels = None
depends_on = None


def upgrade():
    """Add force_password_change boolean column to users table."""
    op.add_column(
        'users',
        sa.Column(
            'force_password_change',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true'),
        ),
    )


def downgrade():
    """Remove force_password_change column from users table."""
    op.drop_column('users', 'force_password_change')
