"""Add DELIVERED status and delivery timestamp."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_add_delivered_status"
down_revision: Union[str, Sequence[str], None] = "0005_credit_integration"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE errand_status ADD VALUE IF NOT EXISTS 'DELIVERED'")
    op.add_column(
        "errands",
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("errands", "delivered_at")
