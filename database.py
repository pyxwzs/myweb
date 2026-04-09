# -*- coding: utf-8 -*-
"""SQLite 连接、建表与站点内容初始化。"""
from __future__ import annotations

import json
import sqlite3

from config import DB_PATH, DEFAULT_SITE_DATA, ENV_PATH


def _password_from_env_file() -> str | None:
    if not ENV_PATH.is_file():
        return None
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("EDITOR_PASSWORD="):
            v = line.split("=", 1)[1].strip()
            return v if v else None
    return None


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_password() -> str:
    conn = connect()
    row = conn.execute(
        "SELECT editor_password FROM site_settings WHERE id = 1"
    ).fetchone()
    conn.close()
    return row["editor_password"] if row else "admin"


def init_db() -> None:
    from upload import (
        backfill_media_assets_from_disk,
        init_media_assets,
        prune_invalid_site_icon_rows,
        sync_site_icon_labels,
    )

    conn = connect()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS site_content (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            payload TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            editor_password TEXT NOT NULL
        )
        """
    )
    init_media_assets(conn)
    conn.commit()
    if conn.execute("SELECT 1 FROM site_settings WHERE id = 1").fetchone() is None:
        initial = _password_from_env_file() or "admin"
        conn.execute(
            "INSERT INTO site_settings (id, editor_password) VALUES (1, ?)",
            (initial,),
        )
        conn.commit()
    row = conn.execute("SELECT payload FROM site_content WHERE id = 1").fetchone()
    if row is None:
        seed = json.dumps(DEFAULT_SITE_DATA, ensure_ascii=False, indent=2)
        conn.execute("INSERT INTO site_content (id, payload) VALUES (1, ?)", (seed,))
        conn.commit()
    backfill_media_assets_from_disk(conn)
    sync_site_icon_labels(conn)
    prune_invalid_site_icon_rows(conn)
    conn.commit()
    conn.close()
