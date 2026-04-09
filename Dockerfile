# Python 3.10 slim — Flask 站点
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5001

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

EXPOSE 5001

# 数据库与上传文件需持久化时请挂载卷，例如:
#   -v myweb-data:/app/data -v myweb-uploads:/app/static/uploads
CMD exec gunicorn -w 1 -b 0.0.0.0:${PORT} app:app
