## 服务器部署（OpenCloudOS 9 + Nginx + Node.js）

### 1) 前端构建与上传

在本地/CI 执行：

- 安装依赖：`npm ci`（或 `npm install`）
- 构建：`npm run build`

将生成的 `dist/` 上传到服务器目录：

- `/var/www/linkgrow/frontend/`

前端请求后端通过环境变量控制：

- [.env.production](file:///c:/Users/Administrator/Desktop/xiangmu/.env.production) 里已设置 `VITE_API_BASE_URL=http://api.linkgrow.xyz`

### 2) 后端启动（3000 端口）

在服务器端（建议用 systemd 或 pm2 管理进程）：

- 安装依赖：`npm ci`（在 `server/` 目录）
- 启动：`npm run dev`（生产建议改为 `node index.js`）

### 3) Nginx 配置

使用配置文件：

- [linkgrow.conf](file:///c:/Users/Administrator/Desktop/xiangmu/deploy/nginx/linkgrow.conf)

按服务器习惯放置到：

- `/etc/nginx/conf.d/linkgrow.conf`

并确保静态文件目录存在：

- `/var/www/linkgrow/frontend`

检查与重载：

- `nginx -t`
- `systemctl reload nginx`

### 4) 常见问题

- 前端打不开/白屏：确认 Nginx `root` 指向 `dist` 解压后的目录，并且 `try_files ... /index.html` 存在
- API 404：确认后端监听 `127.0.0.1:3000` 且 Nginx `proxy_pass` 正确
- 跨域失败：后端已放行 `linkgrow.xyz`，见 [server/index.js](file:///c:/Users/Administrator/Desktop/xiangmu/server/index.js)
