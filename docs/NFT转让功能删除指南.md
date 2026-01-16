# NFT 转让功能删除指南

## 背景说明

NFT 转让功能在中国法律环境下可能存在合规风险。本文档详细列出所有与 NFT 转让相关的代码和数据库结构，供后续系统性删除使用。

## 需要删除的内容清单

### 1. 数据库表

| 表名 | 说明 | 操作 |
|------|------|------|
| `nft_transfers` | NFT 转让记录表 | DROP TABLE |

**SQL 命令**:
```sql
DROP TABLE IF EXISTS nft_transfers CASCADE;
```

### 2. Prisma Schema

**文件**: `apps/web/prisma/schema.prisma`

删除以下模型定义（约第 811-838 行）:
```prisma
// NFT 转让记录表（独立的 NFT 转让，不含门票）
model NFTTransfer {
  id              String    @id @default(uuid())
  userNftId       String
  fromUserId      String
  toUserId        String?
  toUserPhone     String?
  toUserEmail     String?
  transferCode    String    @unique
  message         String?   @db.Text
  transferType    String    @default("gift")
  price           Int?
  status          String    @default("pending")
  expiresAt       DateTime
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("nft_transfers")
  @@index([userNftId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([transferCode])
  @@index([status])
  @@index([expiresAt])
}
```

### 3. Web API 路由

需要删除的整个文件夹:
```
apps/web/app/api/nft/transfer/
├── route.ts           # POST: 创建 NFT 转让
├── accept/
│   └── route.ts       # POST: 接受 NFT 转让
├── cancel/
│   └── route.ts       # POST: 取消 NFT 转让
└── [code]/
    └── route.ts       # GET: 获取转让详情
```

### 4. Mobile App 页面

需要删除的文件:
| 文件路径 | 说明 |
|----------|------|
| `apps/mobile/src/screens/TransferNFTScreen.tsx` | NFT 转让发起页面 |
| `apps/mobile/src/screens/ReceiveNFTTransferScreen.tsx` | NFT 转让接收页面 |

### 5. Mobile App 导航配置

**文件**: `apps/mobile/src/navigation/AppNavigator.tsx`

删除以下导航配置:
```tsx
// 删除 import
import TransferNFTScreen from '../screens/TransferNFTScreen';
import ReceiveNFTTransferScreen from '../screens/ReceiveNFTTransferScreen';

// 删除 Stack.Screen
<Stack.Screen name="TransferNFT" component={TransferNFTScreen} options={{ title: '转让NFT' }} />
<Stack.Screen name="ReceiveNFTTransfer" component={ReceiveNFTTransferScreen} options={{ title: '接收NFT' }} />
```

### 6. Mobile App 服务层

**文件**: `apps/mobile/src/services/nft.ts`

删除以下函数:
- `createNFTTransfer()` - 创建 NFT 转让
- `acceptNFTTransfer()` - 接受 NFT 转让
- `cancelNFTTransfer()` - 取消 NFT 转让
- `getNFTTransferByCode()` - 获取转让详情
- 相关的类型定义 (`NFTTransfer`, `CreateNFTTransferRequest` 等)

### 7. Mobile App UI 入口

**文件**: `apps/mobile/src/screens/NFTDetailScreen.tsx`

删除"转让"按钮及相关逻辑。

**文件**: `apps/mobile/src/screens/ProfileScreen.tsx`

删除 NFT 转让相关的入口和功能。

### 8. 其他相关文件

**文件**: `apps/web/app/api/user/nfts/[id]/route.ts`

检查并删除任何与转让相关的逻辑。

**文件**: `apps/web/app/api/nft/assets/my/route.ts`

检查并删除任何与转让状态相关的查询。

## 删除步骤

### 步骤 1: 备份数据库
```bash
ssh root@<ECS_IP> "docker exec piaoyuzhou-db pg_dump -U postgres piaociyuan > /backup/piaociyuan_backup_$(date +%Y%m%d).sql"
```

### 步骤 2: 删除数据库表
```bash
ssh root@<ECS_IP> "docker exec piaoyuzhou-db psql -U postgres -d piaociyuan -c 'DROP TABLE IF EXISTS nft_transfers CASCADE;'"
```

### 步骤 3: 删除代码文件
```bash
# Web API
rm -rf apps/web/app/api/nft/transfer/

# Mobile 页面
rm apps/mobile/src/screens/TransferNFTScreen.tsx
rm apps/mobile/src/screens/ReceiveNFTTransferScreen.tsx
```

### 步骤 4: 修改 Prisma Schema
编辑 `apps/web/prisma/schema.prisma`，删除 `NFTTransfer` 模型。

### 步骤 5: 修改导航配置
编辑 `apps/mobile/src/navigation/AppNavigator.tsx`，删除相关路由。

### 步骤 6: 修改服务层
编辑 `apps/mobile/src/services/nft.ts`，删除转让相关函数。

### 步骤 7: 修改 UI 入口
编辑 `apps/mobile/src/screens/NFTDetailScreen.tsx`，删除转让按钮。
编辑 `apps/mobile/src/screens/ProfileScreen.tsx`，删除相关入口。

### 步骤 8: 重新生成 Prisma Client
```bash
cd apps/web && npx prisma generate
```

### 步骤 9: 运行类型检查
```bash
# Web
cd apps/web && npm run build

# Mobile
cd apps/mobile && npx tsc --noEmit
```

### 步骤 10: 提交并部署
```bash
git add -A
git commit -m "feat: 移除 NFT 转让功能（合规要求）"
git push
```

## Claude Code 执行命令

复制以下提示词给 Claude Code 执行系统性删除:

```
请按照 docs/NFT转让功能删除指南.md 中的步骤，系统性删除所有 NFT 转让相关功能。

具体要求：
1. 删除 apps/web/app/api/nft/transfer/ 整个目录
2. 删除 apps/mobile/src/screens/TransferNFTScreen.tsx
3. 删除 apps/mobile/src/screens/ReceiveNFTTransferScreen.tsx
4. 从 apps/web/prisma/schema.prisma 中删除 NFTTransfer 模型
5. 从 apps/mobile/src/navigation/AppNavigator.tsx 中删除相关路由
6. 从 apps/mobile/src/services/nft.ts 中删除转让相关函数和类型
7. 从 apps/mobile/src/screens/NFTDetailScreen.tsx 中删除转让按钮
8. 从 apps/mobile/src/screens/ProfileScreen.tsx 中删除相关入口
9. 运行 prisma generate 重新生成客户端
10. 运行类型检查确保没有错误
11. 提交代码

同时连接 ECS 服务器删除 nft_transfers 数据库表。
```

## 注意事项

1. **数据备份**: 删除前务必备份数据库
2. **依赖检查**: 删除前确认没有其他功能依赖这些代码
3. **类型错误**: 删除后可能出现 TypeScript 类型错误，需要逐一修复
4. **测试验证**: 删除后需要完整测试 NFT 相关功能是否正常

## 保留的 NFT 功能

以下 NFT 功能将保留:
- NFT 展示和查看
- NFT 铸造（购票后自动获得）
- NFT 3D 模型展示
- NFT 收藏展示

## 更新日期

- 文档创建: 2026-01-15
- 最后更新: 2026-01-15
