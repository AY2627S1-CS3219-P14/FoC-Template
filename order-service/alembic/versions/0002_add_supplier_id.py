"""Add the supplier UUID required for every errand.

Existing errands must have their supplier IDs backfilled before this migration
can be applied to a populated database. No placeholder supplier is assigned.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_add_supplier_id"
down_revision = "0001_create_errands"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "errands",
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("errands", "supplier_id")
