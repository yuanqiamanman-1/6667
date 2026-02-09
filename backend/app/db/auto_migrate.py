from sqlalchemy import text


def ensure_schema(engine) -> None:
    url = str(getattr(engine, "url", ""))
    if "sqlite" not in url:
        return

    with engine.begin() as conn:
        # 添加 conversation_participants.last_read_at
        rows = conn.execute(text("PRAGMA table_info(conversation_participants)")).fetchall()
        existing = {str(r[1]) for r in rows if r and len(r) > 1}
        if "last_read_at" not in existing:
            conn.execute(text("ALTER TABLE conversation_participants ADD COLUMN last_read_at DATETIME"))
        
        # 添加 community_posts.hidden
        rows = conn.execute(text("PRAGMA table_info(community_posts)")).fetchall()
        existing = {str(r[1]) for r in rows if r and len(r) > 1}
        if "hidden" not in existing:
            conn.execute(text("ALTER TABLE community_posts ADD COLUMN hidden BOOLEAN DEFAULT 0"))
        
        # 添加 qa_questions.hidden
        rows = conn.execute(text("PRAGMA table_info(qa_questions)")).fetchall()
        existing = {str(r[1]) for r in rows if r and len(r) > 1}
        if "hidden" not in existing:
            conn.execute(text("ALTER TABLE qa_questions ADD COLUMN hidden BOOLEAN DEFAULT 0"))
