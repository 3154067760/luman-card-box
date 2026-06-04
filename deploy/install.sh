#!/bin/bash
# 在阿里云服务器上执行（Workbench 或 SSH）
# 用法: bash install.sh

set -e

APP_DIR="/var/www/luman_card_box"
REPO="https://github.com/3154067760/luman-card-box.git"

echo "==> 准备目录 $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> 首次克隆仓库"
  git clone "$REPO" "$APP_DIR"
else
  echo "==> 拉取最新代码"
  cd "$APP_DIR"
  git pull origin main
fi

cd "$APP_DIR"
echo "==> 安装依赖并构建"
npm install
npm run build

echo "==> 设置静态目录权限"
sudo chown -R www-data:www-data "$APP_DIR/dist"

echo ""
echo "完成。静态文件目录: $APP_DIR/dist"
echo "请将 Nginx root 指向该目录，并加入 SPA 回退:"
echo "  try_files \$uri \$uri/ /index.html;"
echo ""
echo "示例配置见 deploy/nginx.conf"
