# myweb

个人主页站点，基于 Flask + SQLite。首页内容通过可视化编辑器在线维护，无需改代码即可更新资料、链接、站点列表与图片。

## 功能

- **首页展示**：个人资料、标签、时间线、站点/项目卡片、技能图、社交链接
- **可视化编辑器**（`/editor`）：密码保护，表单化编辑全部站点 JSON
- **图片上传**：头像、头像框、favicon、赞助/QQ 二维码、站点图标库（`i1`、`i2`…）
- **小程序码**：站点卡片支持上传小程序二维码，点击弹出大图
- **主题切换**：浅色 / 深色，Cookie 记忆
- **自定义 404**：未知路径返回风格统一的 404 页
- **Docker 部署**：Compose 一键构建启动，数据与上传目录持久化

## 技术栈

| 层级 | 说明 |
|------|------|
| 后端 | Python 3.12、Flask 3、Gunicorn |
| 数据库 | SQLite（`data/myweb.db`，不纳入 Git） |
| 前端 | 原生 HTML / CSS / JavaScript |
| 部署 | Docker、docker-compose |

## 项目结构

```
myweb/
├── app.py              # 应用入口
├── config.py           # 路径与默认站点数据
├── database.py         # SQLite 初始化
├── upload.py           # 图片上传与媒体库
├── routes/
│   ├── pages.py        # 页面路由
│   └── api.py          # JSON API
├── templates/
│   ├── index.html      # 首页
│   ├── editor.html     # 编辑器
│   └── 404.html
├── static/
│   ├── css/
│   ├── js/script.js
│   └── uploads/        # 用户上传（运行时）
├── data/               # SQLite（运行时，已 gitignore）
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## 本地开发

### 环境要求

- Python 3.10+
- pip

### 启动

```bash
# 克隆项目
git clone https://github.com/pyxwzs/myweb.git
cd myweb

# 虚拟环境（推荐）
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动（默认 http://127.0.0.1:5001）
python app.py
```

首次启动会自动创建 `data/myweb.db` 并写入默认空内容。

### 编辑器

1. 浏览器打开 `http://127.0.0.1:5001/editor`
2. 默认密码：`admin`（可在编辑器内修改，或通过 `.env` 设置初始密码）
3. 编辑完成后点击「保存到服务器」，刷新首页生效

### 初始密码（可选）

在项目根目录创建 `.env`：

```env
EDITOR_PASSWORD=你的密码
```

仅在数据库中尚无密码记录时生效。

## Docker 部署

### 构建并启动

```bash
docker compose build
docker compose up -d
```

或一条命令：

```bash
docker compose up -d --build
```

默认映射端口 **5001**，访问 `http://<主机>:5001`。

### 数据持久化

Compose 已配置两个卷：

| 卷 | 挂载路径 | 内容 |
|----|----------|------|
| `myweb_data` | `/app/data` | SQLite 数据库 |
| `myweb_uploads` | `/app/static/uploads` | 上传图片 |

### 构建镜像说明

- 基础镜像：`docker.m.daocloud.io/library/python:3.12-slim`
- 本地镜像名：`myweb:latest`
- `pull_policy: build` 避免从 Docker Hub 误拉取不存在的镜像

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/content` | 读取/保存站点 JSON、修改密码、媒体列表 |
| POST | `/api/upload` | 上传图片（需密码） |

页面路由：

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/editor` | 内容编辑器 |
| 其他 | 自定义 404 页 |

## 站点数据结构（节选）

内容以 JSON 存于 SQLite，编辑器与首页共用同一结构：

```json
{
  "site": { "title": "", "description": "", "keywords": "", "favicon": "" },
  "profile": { "name": "", "location": "", "school": "", "role": "", "avatar": "" },
  "tags": ["标签1", "标签2"],
  "timeline": [{ "text": "事件", "date": "2024.12" }],
  "sites": [{
    "title": "站点名",
    "desc": "描述",
    "url": "https://example.com",
    "img": "/static/uploads/i1.png",
    "qrcode": "/static/uploads/i2.png
  }],
  "projects": [],
  "links": { "github": "", "mail": "", "sponsorImg": "", "qqImg": "" },
  "footer": { "text": "", "beianUrl": "", "beianNo": "" }
}
```

## 生产环境建议

```bash
gunicorn -w 1 -b 0.0.0.0:5001 app:app
```

- 使用 Nginx / Caddy 反向代理并配置 HTTPS
- 定期备份 `data/myweb.db` 与 `static/uploads/`
- 修改默认编辑器密码
- `.env` 与 `data/` 勿提交到 Git（已在 `.gitignore` 中）

## 常见问题

**Q: `docker compose up` 一直 Pulling？**  
A: 使用 `docker compose up -d --build`，或先 `docker compose build` 再 `up -d`。

**Q: 页脚出现一条透明长条？**  
A: 未配置页脚内容时自动隐藏；在编辑器「页脚」面板填写文字或备案信息即可。

**Q: 上传图片不显示？**  
A: 确认 `static/uploads/` 目录可写；Docker 部署需挂载 `myweb_uploads` 卷。

## License

个人项目，按需使用与修改。
