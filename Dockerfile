FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

# ============ 安装系统依赖 (Nginx + Supervisor + Node.js) ============
RUN apt-get update && \
    apt-get install -y curl nginx supervisor && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ============ 复制项目文件 ============
COPY ./backend /home/user/app/backend
COPY ./frontend /home/user/app/frontend

# ============ 安装后端依赖 ============
RUN pip install --no-cache-dir -r /home/user/app/backend/requirements.txt

# ============ 安装前端依赖并构建 ============
WORKDIR /home/user/app/frontend
RUN npm ci && npm run build

# ============ 配置 Nginx 反向代理 ============
RUN rm -f /etc/nginx/sites-enabled/default
COPY ./nginx.conf /etc/nginx/sites-enabled/app

# ============ 配置 Supervisor 进程管理 ============
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ============ 创建日志目录 ============
RUN mkdir -p /var/log/supervisor /var/log/nginx

# ============ 返回工作目录 ============
WORKDIR /home/user/app

# ============ 暴露端口 7860 ============
EXPOSE 7860

# ============ 启动 Supervisor ============
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
