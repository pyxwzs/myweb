# -*- coding: utf-8 -*-
"""路径与常量。"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "myweb.db"
ENV_PATH = ROOT / ".env"

DEFAULT_SITE_DATA: dict = {
    "site": {
        "title": "",
        "description": "",
        "keywords": "",
        "favicon": "",
    },
    "profile": {
        "name": "",
        "location": "",
        "school": "",
        "role": "",
        "roleLabel": "",
        "slogan": "",
        "avatar": "",
        "avatarFrame": "",
    },
    "tags": [],
    "timeline": [],
    "sites": [],
    "projects": [],
    "links": {
        "github": "",
        "mail": "",
        "sponsorImg": "",
        "qqImg": "",
    },
    "footer": {"text": "", "beianUrl": "", "beianNo": ""},
}

UPLOAD_DIR = ROOT / "static" / "uploads"
ALLOWED_UPLOAD_EXT = frozenset({".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg"})
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

MEDIA_POOL_KIND = "site_icon"
MEDIA_SLOT_KINDS = frozenset(
    {"avatar", "avatar_frame", "favicon", "sponsor", "qq"},
)
ALL_MEDIA_KINDS = frozenset({MEDIA_POOL_KIND}) | MEDIA_SLOT_KINDS
