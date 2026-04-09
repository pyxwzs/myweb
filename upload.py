# -*- coding: utf-8 -*-
"""静态文件上传、media_assets 表与站点图标池（i1、i2…）。"""
from __future__ import annotations

import re
import sqlite3
from pathlib import Path

from config import (
    ALLOWED_UPLOAD_EXT,
    MEDIA_POOL_KIND,
    MEDIA_SLOT_KINDS,
    UPLOAD_DIR,
)


def _safe_unlink_upload_url(url: str) -> None:
    if not url.startswith("/static/uploads/"):
        return
    name = url.strip().rsplit("/", 1)[-1]
    if not name or "/" in name or ".." in name:
        return
    path = (UPLOAD_DIR / name).resolve()
    try:
        path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        return
    if path.is_file():
        path.unlink()


def init_media_assets(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS media_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            path TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """
    )
    cols = {row[1] for row in conn.execute("PRAGMA table_info(media_assets)").fetchall()}
    if "label" not in cols:
        conn.execute("ALTER TABLE media_assets ADD COLUMN label TEXT")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_media_assets_kind ON media_assets(kind)"
    )


def _parse_site_icon_index_from_stem(stem: str) -> int | None:
    m = re.match(r"^i(\d+)$", stem, re.IGNORECASE)
    if not m:
        return None
    return int(m.group(1))


def _is_valid_site_icon_entry(path: str, label: str | None) -> bool:
    if label and _parse_site_icon_index_from_stem(str(label).strip()) is not None:
        return True
    stem = Path(path.rsplit("/", 1)[-1]).stem
    return _parse_site_icon_index_from_stem(stem) is not None


def prune_invalid_site_icon_rows(conn: sqlite3.Connection) -> None:
    for row in conn.execute(
        "SELECT id, path, label FROM media_assets WHERE kind = ?", (MEDIA_POOL_KIND,)
    ).fetchall():
        if not _is_valid_site_icon_entry(row["path"], row["label"]):
            conn.execute("DELETE FROM media_assets WHERE id = ?", (row["id"],))


def _max_site_icon_index(conn: sqlite3.Connection) -> int:
    m = 0
    for row in conn.execute(
        "SELECT path, label FROM media_assets WHERE kind = ?", (MEDIA_POOL_KIND,)
    ).fetchall():
        if not _is_valid_site_icon_entry(row["path"], row["label"]):
            continue
        if row["label"]:
            n = _parse_site_icon_index_from_stem(str(row["label"]))
            if n is not None:
                m = max(m, n)
                continue
        name = Path(row["path"].rsplit("/", 1)[-1]).stem
        n2 = _parse_site_icon_index_from_stem(name)
        if n2 is not None:
            m = max(m, n2)
    if UPLOAD_DIR.is_dir():
        for f in UPLOAD_DIR.iterdir():
            if not f.is_file() or f.name.startswith("."):
                continue
            n3 = _parse_site_icon_index_from_stem(f.stem)
            if n3 is not None:
                m = max(m, n3)
    return m


def _next_site_icon_label(conn: sqlite3.Connection) -> str:
    return f"i{_max_site_icon_index(conn) + 1}"


def sync_site_icon_labels(conn: sqlite3.Connection) -> None:
    for row in conn.execute(
        "SELECT id, path FROM media_assets WHERE kind = ? AND (label IS NULL OR label = '')",
        (MEDIA_POOL_KIND,),
    ).fetchall():
        stem = Path(row["path"].rsplit("/", 1)[-1]).stem
        if _parse_site_icon_index_from_stem(stem) is not None:
            conn.execute(
                "UPDATE media_assets SET label = ? WHERE id = ?", (stem, row["id"])
            )


def backfill_media_assets_from_disk(conn: sqlite3.Connection) -> None:
    if not UPLOAD_DIR.is_dir():
        return
    existing = {
        row["path"]
        for row in conn.execute("SELECT path FROM media_assets").fetchall()
    }
    for f in UPLOAD_DIR.iterdir():
        if not f.is_file():
            continue
        if f.name.startswith(".") or f.name.startswith("slot_"):
            continue
        if f.suffix.lower() not in ALLOWED_UPLOAD_EXT:
            continue
        url = f"/static/uploads/{f.name}"
        if url in existing:
            continue
        stem = f.stem
        if _parse_site_icon_index_from_stem(stem) is None:
            continue
        conn.execute(
            "INSERT INTO media_assets (kind, path, label) VALUES (?, ?, ?)",
            (MEDIA_POOL_KIND, url, stem),
        )
        existing.add(url)


def store_upload(kind: str, ext: str, data: bytes) -> dict:
    """写入 uploads 与 media_assets，返回可 JSON 序列化的结果（含可选 label）。"""
    from database import connect

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    conn = connect()
    label: str | None = None

    if kind == MEDIA_POOL_KIND:
        label = _next_site_icon_label(conn)
        name = f"{label}{ext}"
        url = f"/static/uploads/{name}"
        dest = UPLOAD_DIR / name
        if dest.is_file():
            dest.unlink()
        dest.write_bytes(data)
        conn.execute(
            "INSERT INTO media_assets (kind, path, label) VALUES (?, ?, ?)",
            (MEDIA_POOL_KIND, url, label),
        )
    else:
        for p in UPLOAD_DIR.glob(f"slot_{kind}.*"):
            p.unlink(missing_ok=True)
        rows = conn.execute(
            "SELECT path FROM media_assets WHERE kind = ?", (kind,)
        ).fetchall()
        for row in rows:
            _safe_unlink_upload_url(row["path"])
        conn.execute("DELETE FROM media_assets WHERE kind = ?", (kind,))
        name = f"slot_{kind}{ext}"
        url = f"/static/uploads/{name}"
        (UPLOAD_DIR / name).write_bytes(data)
        conn.execute(
            "INSERT INTO media_assets (kind, path, label) VALUES (?, ?, NULL)",
            (kind, url),
        )

    conn.commit()
    conn.close()

    out: dict = {"ok": True, "url": url, "kind": kind}
    if kind == MEDIA_POOL_KIND and label:
        out["label"] = label
    return out


def build_media_list_payload() -> dict:
    from database import connect

    conn = connect()
    pool_rows = conn.execute(
        "SELECT id, path, label FROM media_assets WHERE kind = ?",
        (MEDIA_POOL_KIND,),
    ).fetchall()
    pool_rows = [
        r
        for r in pool_rows
        if _is_valid_site_icon_entry(r["path"], r["label"])
    ]

    def _pool_sort_key(r: sqlite3.Row) -> tuple[int, str]:
        lab = r["label"] or Path(r["path"].rsplit("/", 1)[-1]).stem
        n = _parse_site_icon_index_from_stem(str(lab))
        return (n if n is not None else 999_999, r["path"])

    pool_rows = sorted(pool_rows, key=_pool_sort_key)
    site_icons = [
        {
            "id": r["id"],
            "label": (r["label"] or Path(r["path"].rsplit("/", 1)[-1]).stem),
            "path": r["path"],
        }
        for r in pool_rows
    ]
    slots: dict[str, str | None] = {k: None for k in MEDIA_SLOT_KINDS}
    for r in conn.execute(
        "SELECT kind, path FROM media_assets WHERE kind IN ("
        + ",".join("?" * len(MEDIA_SLOT_KINDS))
        + ")",
        tuple(MEDIA_SLOT_KINDS),
    ).fetchall():
        slots[r["kind"]] = r["path"]
    conn.close()
    return {
        "ok": True,
        "site_icons": site_icons,
        "slots": slots,
        "kinds": {
            "pool": MEDIA_POOL_KIND,
            "slots": sorted(MEDIA_SLOT_KINDS),
        },
    }
