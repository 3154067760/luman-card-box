#!/bin/bash
# 在阿里云服务器上执行
set -e

APP_DIR="/var/www/luman_card_box"
REPO="https://github.com/3154067760/luman-card-box.git"

echo "==> 准备目录 $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  cd "$APP_DIR" && git pull origin main
fi

cd "$APP_DIR"
echo "==> 构建前端"
npm install
npm run build

echo "==> 启动同步服务 (PM2)"
  if command -v pm2 >/dev/null; then
    pm2 describe luman-card-box >/dev/null 2>&1 && pm2 restart luman-card-box || pm2 start server/index.mjs --name luman-card-box --cwd "$APP_DIR"
    pm2 save
  else
    echo "未安装 PM2，请: PORT=3005 node server/index.mjs"
  fi

echo "访问: http://39.105.176.96:3005"
