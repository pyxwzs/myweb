# -*- coding: utf-8 -*-
"""Flask 应用入口：注册路由与全局行为。
启动: pip install -r requirements.txt && python app.py
本地：http://127.0.0.1:5001/ ；生产：gunicorn -w 1 -b 0.0.0.0:5001 app:app"""
from __future__ import annotations

import os

from flask import Flask, Response

from database import init_db
from routes.api import bp as api_bp
from routes.pages import bp as pages_bp

app = Flask(
    __name__,
    static_folder="static",
    static_url_path="/static",
    template_folder="templates",
)

app.register_blueprint(pages_bp)
app.register_blueprint(api_bp)


def apply_no_cache(response: Response) -> Response:
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    return response


@app.after_request
def _after(resp: Response):  # noqa: ANN001
    return apply_no_cache(resp)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")), debug=True)
