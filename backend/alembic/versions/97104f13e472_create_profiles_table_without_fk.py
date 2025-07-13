"""Create profiles table without FK

Revision ID: 97104f13e472
Revises: b913e2af69d1
Create Date: 2025-07-10 15:38:32.265241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97104f13e472'
down_revision: Union[str, Sequence[str], None] = 'b913e2af69d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create profiles table, add foreign key, and set up trigger."""
    # Enable pgcrypto extension for gen_random_uuid()
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    op.create_table('profiles',
        sa.Column('id', sa.UUID(), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False, unique=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, onupdate=sa.func.now()),
        sa.Column('username', sa.String(), nullable=True, unique=True),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
    )

    op.create_foreign_key(
        'fk_profiles_user_id',
        'profiles',
        'users',
        ['user_id'],
        ['id'],
        source_schema='public',
        referent_schema='auth',
        ondelete='CASCADE'
    )

    op.execute("""
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)

    op.execute("""
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    """)


def downgrade() -> None:
    """Drop the profiles table and the associated trigger."""
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_user();")
    op.drop_table('profiles', schema='public')
    op.execute('DROP EXTENSION IF EXISTS pgcrypto;')


