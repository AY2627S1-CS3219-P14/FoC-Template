"""Add the required item description to errands.

Adding a required column without a default requires an empty errands table.
If existing errands are present, use a staged migration to add a nullable column,
backfill actual item descriptions, then enforce NOT NULL and the nonblank check.
This migration intentionally fails rather than inventing descriptions or deleting data.
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_add_required_item"
down_revision = "0002_add_supplier_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("errands", sa.Column("required_item", sa.Text(), nullable=False))
    op.create_check_constraint(
        "required_item_nonblank", "errands", "length(trim(required_item)) > 0"
    )


def downgrade() -> None:
    op.drop_constraint("required_item_nonblank", "errands", type_="check")
    op.drop_column("errands", "required_item")
