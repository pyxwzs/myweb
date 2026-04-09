# -*- coding: utf-8 -*-
"""JSON API：上传与站点内容。"""
from __future__ import annotations

import json
from pathlib import Path

from flask import Blueprint, Response, request
from werkzeug.utils import secure_filename

from config import (
    ALL_MEDIA_KINDS,
    ALLOWED_UPLOAD_EXT,
    MAX_UPLOAD_BYTES,
    MEDIA_POOL_KIND,
)
from database import connect, get_password, init_db
from upload import build_media_list_payload, store_upload

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/upload", methods=["POST"])
def api_upload():
    init_db()
    pwd = request.form.get("pwd", "")
    if pwd != get_password():
        return (
            json.dumps({"ok": False, "msg": "密码错误"}, ensure_ascii=False),
            403,
            {"Content-Type": "application/json; charset=utf-8"},
        )
    f = request.files.get("file")
    if not f or not f.filename:
        return (
            json.dumps({"ok": False, "msg": "未选择文件"}, ensure_ascii=False),
            400,
            {"Content-Type": "application/json; charset=utf-8"},
        )
    raw_name = secure_filename(f.filename)
    ext = Path(raw_name).suffix.lower()
    if ext not in ALLOWED_UPLOAD_EXT:
        return (
            json.dumps(
                {"ok": False, "msg": "仅支持图片：png/jpg/gif/webp/ico/svg"},
                ensure_ascii=False,
            ),
            400,
            {"Content-Type": "application/json; charset=utf-8"},
        )
    data = f.read()
    if len(data) > MAX_UPLOAD_BYTES:
        return (
            json.dumps({"ok": False, "msg": "文件过大（最大 5MB）"}, ensure_ascii=False),
            413,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    kind = (request.form.get("kind") or MEDIA_POOL_KIND).strip()
    if kind not in ALL_MEDIA_KINDS:
        kind = MEDIA_POOL_KIND

    out = store_upload(kind, ext, data)
    return (
        json.dumps(out, ensure_ascii=False),
        200,
        {"Content-Type": "application/json; charset=utf-8"},
    )


@bp.route("/content", methods=["POST"])
def api_content():
    init_db()
    body = request.get_json(force=True, silent=True)
    if not isinstance(body, dict):
        body = {}

    if body.get("action") == "get":
        conn = connect()
        row = conn.execute("SELECT payload FROM site_content WHERE id = 1").fetchone()
        conn.close()
        if not row:
            return (
                json.dumps({"ok": False, "msg": "暂无内容"}, ensure_ascii=False),
                404,
                {"Content-Type": "application/json; charset=utf-8"},
            )
        return Response(
            row["payload"],
            200,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if body.get("action") == "media_list":
        if body.get("pwd") != get_password():
            return (
                json.dumps({"ok": False, "msg": "密码错误"}, ensure_ascii=False),
                403,
                {"Content-Type": "application/json; charset=utf-8"},
            )
        payload = build_media_list_payload()
        return (
            json.dumps(payload, ensure_ascii=False),
            200,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if body.get("action") == "set_password":
        if "pwd" not in body or "new_pwd" not in body:
            return (
                json.dumps({"ok": False, "msg": "Bad Request"}, ensure_ascii=False),
                400,
                {"Content-Type": "application/json; charset=utf-8"},
            )
        new_pwd = body.get("new_pwd")
        if not isinstance(new_pwd, str) or not new_pwd.strip():
            return (
                json.dumps({"ok": False, "msg": "新密码不能为空"}, ensure_ascii=False),
                400,
                {"Content-Type": "application/json; charset=utf-8"},
            )
        new_pwd = new_pwd.strip()
        if body["pwd"] != get_password():
            return (
                json.dumps({"ok": False, "msg": "密码错误"}, ensure_ascii=False),
                403,
                {"Content-Type": "application/json; charset=utf-8"},
            )
        conn = connect()
        conn.execute(
            "UPDATE site_settings SET editor_password = ? WHERE id = 1",
            (new_pwd,),
        )
        conn.commit()
        conn.close()
        return (
            json.dumps({"ok": True, "msg": "密码已更新"}, ensure_ascii=False),
            200,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if "pwd" not in body:
        return (
            json.dumps({"ok": False, "msg": "Bad Request"}, ensure_ascii=False),
            400,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if body["pwd"] != get_password():
        return (
            json.dumps({"ok": False, "msg": "密码错误"}, ensure_ascii=False),
            403,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if body.get("check"):
        return (
            json.dumps({"ok": True, "msg": "密码正确"}, ensure_ascii=False),
            200,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    if "data" not in body:
        return (
            json.dumps({"ok": False, "msg": "Bad Request"}, ensure_ascii=False),
            400,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    try:
        pretty = json.dumps(body["data"], ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        return (
            json.dumps({"ok": False, "msg": "JSON 格式错误"}, ensure_ascii=False),
            400,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    conn = connect()
    conn.execute(
        "INSERT OR REPLACE INTO site_content (id, payload) VALUES (1, ?)",
        (pretty,),
    )
    conn.commit()
    conn.close()

    return (
        json.dumps({"ok": True, "msg": "保存成功"}, ensure_ascii=False),
        200,
        {"Content-Type": "application/json; charset=utf-8"},
    )
