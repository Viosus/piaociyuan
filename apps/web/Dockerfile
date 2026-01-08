# 阶段1: 依赖安装
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 复制 monorepo 根目录的配置
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# 安装依赖
RUN npm ci --legacy-peer-deps

# 阶段2: 构建
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 shared 包
WORKDIR /app/packages/shared
RUN npm run build 2>/dev/null || echo "No build script for shared"

# 构建 web 应用
WORKDIR /app/apps/web
RUN npm run build

# 阶段3: 生产镜像
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

# 复制自定义服务器文件
COPY --from=builder /app/apps/web/server.js ./
COPY --from=builder /app/apps/web/node_modules ./node_modules

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# 使用自定义服务器启动（支持 Socket.io）
CMD ["node", "server.js"]
