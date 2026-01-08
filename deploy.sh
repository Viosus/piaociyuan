#!/bin/bash

# ============================================
# 票遇洲 - 阿里云部署脚本
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo_error "Docker 未安装，正在安装..."
        curl -fsSL https://get.docker.com | sh
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        echo_info "Docker 安装完成，请重新登录后再运行此脚本"
        exit 1
    fi
    echo_info "Docker 已安装: $(docker --version)"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo_error "Docker Compose 未安装，正在安装..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    echo_info "Docker Compose 已安装"
}

# 创建环境变量文件
create_env_file() {
    if [ ! -f .env ]; then
        echo_info "创建 .env 文件..."
        cat > .env << EOF
# 数据库配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=piaociyuan

# JWT 配置（请生成新的安全密钥）
JWT_SECRET=$(openssl rand -hex 64)
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_EXPIRES=7d

# 加密密钥
ENCRYPTION_KEY=$(openssl rand -hex 32)

# 应用 URL（替换为你的域名）
NEXT_PUBLIC_APP_URL=http://your-domain.com

# Redis 密码
REDIS_PASSWORD=$(openssl rand -hex 16)

# NFT 配置（可选）
NFT_ENABLED=false
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_CHAIN_ID=80002
EOF
        echo_warn "请编辑 .env 文件，设置你的密码和域名"
        echo_warn "运行: nano .env"
    else
        echo_info ".env 文件已存在"
    fi
}

# 构建镜像
build_images() {
    echo_info "构建 Docker 镜像..."
    docker-compose build --no-cache
}

# 启动服务
start_services() {
    echo_info "启动服务..."
    docker-compose up -d
    echo_info "等待服务启动..."
    sleep 10
    docker-compose ps
}

# 停止服务
stop_services() {
    echo_info "停止服务..."
    docker-compose down
}

# 查看日志
view_logs() {
    docker-compose logs -f --tail=100
}

# 运行数据库迁移
run_migrations() {
    echo_info "运行数据库迁移..."
    docker-compose exec web npx prisma migrate deploy
}

# 健康检查
health_check() {
    echo_info "健康检查..."
    curl -f http://localhost/health || echo_error "健康检查失败"
}

# 备份数据库
backup_database() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo_info "备份数据库到 $BACKUP_FILE..."
    docker-compose exec -T postgres pg_dump -U postgres piaociyuan > "$BACKUP_FILE"
    echo_info "备份完成: $BACKUP_FILE"
}

# 恢复数据库
restore_database() {
    if [ -z "$1" ]; then
        echo_error "请指定备份文件: ./deploy.sh restore backup_xxx.sql"
        exit 1
    fi
    echo_warn "即将恢复数据库，这将覆盖现有数据！"
    read -p "确认继续? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec -T postgres psql -U postgres piaociyuan < "$1"
        echo_info "数据库恢复完成"
    fi
}

# 清理旧镜像
cleanup() {
    echo_info "清理未使用的 Docker 资源..."
    docker system prune -f
}

# SSL 证书（Let's Encrypt）
setup_ssl() {
    echo_info "设置 SSL 证书..."
    if [ -z "$1" ]; then
        echo_error "请指定域名: ./deploy.sh ssl your-domain.com"
        exit 1
    fi
    DOMAIN=$1

    # 安装 certbot
    if ! command -v certbot &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot
    fi

    # 停止 nginx 以便 certbot 使用 80 端口
    docker-compose stop nginx

    # 获取证书
    sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

    # 复制证书到 nginx 目录
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./nginx/ssl/
    sudo chown -R $USER:$USER ./nginx/ssl/

    echo_info "SSL 证书已配置，请修改 nginx/conf.d/default.conf 启用 HTTPS"

    # 重启服务
    docker-compose start nginx
}

# 显示帮助
show_help() {
    echo "
票遇洲 - 阿里云部署脚本

用法: ./deploy.sh [命令]

命令:
  init        初始化环境（检查 Docker、创建 .env）
  build       构建 Docker 镜像
  start       启动所有服务
  stop        停止所有服务
  restart     重启所有服务
  logs        查看日志
  migrate     运行数据库迁移
  health      健康检查
  backup      备份数据库
  restore     恢复数据库 (需要指定备份文件)
  ssl         设置 SSL 证书 (需要指定域名)
  cleanup     清理未使用的 Docker 资源
  help        显示此帮助信息

示例:
  ./deploy.sh init          # 首次部署前运行
  ./deploy.sh build         # 构建镜像
  ./deploy.sh start         # 启动服务
  ./deploy.sh ssl domain.com # 配置 SSL
"
}

# 主函数
main() {
    case "$1" in
        init)
            check_docker
            check_docker_compose
            create_env_file
            ;;
        build)
            build_images
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        logs)
            view_logs
            ;;
        migrate)
            run_migrations
            ;;
        health)
            health_check
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$2"
            ;;
        ssl)
            setup_ssl "$2"
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
