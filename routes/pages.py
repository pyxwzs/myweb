# -*- coding: utf-8 -*-
"""静态页模板路由。"""
from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pages", __name__)


@bp.route("/")
@bp.route("/index.html")
def index():
    return render_template("index.html")


@bp.route("/editor")
@bp.route("/editor.html")
def editor_page():
    return render_template("editor.html")


@bp.route("/404.html")
def page_404():
    return render_template("404.html")
