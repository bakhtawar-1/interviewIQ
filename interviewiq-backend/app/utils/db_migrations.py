from sqlalchemy import text
from app.database import engine

def run_manual_migrations():
    """
    Manually add missing columns to the database if they don't exist.
    This is a lightweight alternative to Alembic for simple schema updates.
    """
    columns_to_add = [
        ("users", "justification", "TEXT"),
        ("users", "rejection_reason", "TEXT"),
        ("users", "otp_code", "VARCHAR(6)"),
        ("users", "otp_expires_at", "TIMESTAMP WITH TIME ZONE"),
    ]

    with engine.connect() as conn:
        for table, column, col_type in columns_to_add:
            try:
                # Check if column exists
                check_query = text(f"""
                    SELECT count(*) 
                    FROM information_schema.columns 
                    WHERE table_name='{table}' AND column_name='{column}';
                """)
                result = conn.execute(check_query).scalar()
                
                if result == 0:
                    print(f"Adding column {column} to table {table}...")
                    alter_query = text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};")
                    conn.execute(alter_query)
                    conn.commit()
                    print(f"✅ Added {column} to {table}")
                else:
                    # print(f"Column {column} already exists in {table}")
                    pass
            except Exception as e:
                print(f"❌ Error adding column {column} to {table}: {e}")
