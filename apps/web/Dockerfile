# 阶段1: 依赖安装和构建
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖
RUN npm ci --legacy-peer-deps

# 生成 Prisma 客户端
WORKDIR /app/apps/web
RUN npx prisma generate

# 构建 shared 包
WORKDIR /app/packages/shared
RUN npm run build 2>/dev/null || echo "No build script for shared"

# 构建 web 应用
WORKDIR /app/apps/web
RUN npm run build

# 阶段2: 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/server.js ./server.js
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/lib ./lib

# 复制 node_modules（先复制 apps/web 的，再复制根目录的来覆盖/补充 Prisma 等）
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules

# 修复 Prisma client 符号链接（Turbopack 生成的链接在复制后会失效）
RUN if [ -d ".next/node_modules/@prisma" ]; then \
    for link in .next/node_modules/@prisma/client-*; do \
      if [ -L "$link" ]; then \
        rm "$link" && ln -s ../../../node_modules/@prisma/client "$link"; \
      fi; \
    done; \
  fi

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# 使用自定义服务器启动（支持 Socket.io）
CMD ["node", "server.js"]
