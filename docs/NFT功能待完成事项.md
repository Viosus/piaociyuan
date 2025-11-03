# NFT功能待完成事项

## 概述

票次元平台的NFT基础功能已经集成完成，包括钱包连接、订单转NFT请求等核心功能。本文档列出了需要完成的剩余工作，按优先级从高到低排列。

---

## 一、区块链配置（必需）

### 1.1 获取区块链RPC节点

**目标**：连接到Polygon Amoy测试网（或主网）

**步骤**：

1. 注册Alchemy账号（推荐）或Infura
   - Alchemy官网：https://www.alchemy.com/
   - Infura官网：https://www.infura.io/

2. 创建新应用
   - 选择网络：Polygon Amoy（测试网）或 Polygon（主网）
   - 获取API Key

3. 配置环境变量 `.env`
   ```env
   # 区块链配置
   BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY_HERE
   BLOCKCHAIN_CHAIN_ID=80002  # Amoy测试网
   # BLOCKCHAIN_CHAIN_ID=137  # Polygon主网（生产环境使用）
   ```

**测试**：
```bash
# 使用curl测试RPC节点
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

### 1.2 创建平台钱包

**目标**：生成用于支付gas费的平台钱包

**步骤**：

1. 使用Node.js生成新钱包（仅执行一次）
   ```javascript
   // scripts/generate-wallet.js
   const { ethers } = require('ethers');

   const wallet = ethers.Wallet.createRandom();
   console.log('地址:', wallet.address);
   console.log('私钥:', wallet.privateKey);
   console.log('助记词:', wallet.mnemonic.phrase);
   ```

2. 运行脚本
   ```bash
   node scripts/generate-wallet.js
   ```

3. 保存输出结果到安全位置（助记词和私钥）

4. 配置环境变量 `.env`
   ```env
   MINT_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

5. 给钱包充值
   - 测试网：使用水龙头获取测试币
     - Polygon Amoy水龙头：https://faucet.polygon.technology/
   - 主网：转入足够的MATIC代币支付gas费

**安全警告**：
- ⚠️ 私钥和助记词必须保密，不要上传到Git仓库
- ⚠️ 测试网和主网使用不同的钱包
- ⚠️ 主网钱包应使用硬件钱包或密钥管理服务

---

## 二、智能合约部署（必需）

### 2.1 编写NFT智能合约

**位置**：`contracts/TicketNFT.sol`

**功能要求**：
- 基于ERC-721标准
- 支持批量铸造（节省gas）
- 包含票品元数据（活动ID、票档、座位号等）
- 支持平台管理员权限
- 可暂停/恢复铸造

**参考合约模板**：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TicketNFT is ERC721URIStorage, Ownable, Pausable {
    uint256 private _tokenIdCounter;

    // 映射：tokenId => 订单ID
    mapping(uint256 => string) public tokenToOrder;

    // 映射：tokenId => 活动ID
    mapping(uint256 => uint256) public tokenToEvent;

    constructor() ERC721("PiaoCiYuan Ticket", "PYZT") {}

    function mint(
        address to,
        string memory orderId,
        uint256 eventId,
        string memory metadataUri
    ) public onlyOwner whenNotPaused returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataUri);

        tokenToOrder[tokenId] = orderId;
        tokenToEvent[tokenId] = eventId;

        return tokenId;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
```

**依赖安装**：
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

---

### 2.2 部署智能合约

**工具**：Hardhat

**步骤**：

1. 创建Hardhat配置文件 `hardhat.config.js`
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require('dotenv').config();

   module.exports = {
     solidity: "0.8.20",
     networks: {
       amoy: {
         url: process.env.BLOCKCHAIN_RPC_URL,
         accounts: [process.env.MINT_WALLET_PRIVATE_KEY],
         chainId: 80002
       },
       polygon: {
         url: process.env.BLOCKCHAIN_RPC_URL,
         accounts: [process.env.MINT_WALLET_PRIVATE_KEY],
         chainId: 137
       }
     }
   };
   ```

2. 创建部署脚本 `scripts/deploy-nft-contract.js`
   ```javascript
   const hre = require("hardhat");

   async function main() {
     const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
     const ticketNFT = await TicketNFT.deploy();
     await ticketNFT.deployed();

     console.log("TicketNFT deployed to:", ticketNFT.address);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

3. 部署合约
   ```bash
   # 部署到测试网
   npx hardhat run scripts/deploy-nft-contract.js --network amoy

   # 部署到主网（生产环境）
   npx hardhat run scripts/deploy-nft-contract.js --network polygon
   ```

4. 记录合约地址，配置到 `.env`
   ```env
   NFT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
   ```

5. 在区块链浏览器验证合约（可选但推荐）
   ```bash
   npx hardhat verify --network amoy YOUR_CONTRACT_ADDRESS
   ```

---

## 三、元数据存储（必需）

### 3.1 选择存储方案

**方案对比**：

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| IPFS | 去中心化、永久存储 | 需要维护节点 | ⭐⭐⭐⭐⭐ |
| Arweave | 永久存储、简单 | 成本较高 | ⭐⭐⭐⭐ |
| AWS S3 + CloudFront | 高可用、快速 | 中心化 | ⭐⭐⭐ |

**推荐使用IPFS + Pinata服务**

---

### 3.2 配置IPFS存储

**步骤**：

1. 注册Pinata账号
   - 官网：https://www.pinata.cloud/
   - 获取API Key和Secret

2. 配置环境变量 `.env`
   ```env
   # IPFS配置
   PINATA_API_KEY=your_api_key
   PINATA_SECRET_KEY=your_secret_key
   PINATA_GATEWAY_URL=https://gateway.pinata.cloud
   ```

3. 安装依赖
   ```bash
   npm install @pinata/sdk
   ```

4. 创建元数据上传工具 `lib/ipfs.ts`
   ```typescript
   import pinataSDK from '@pinata/sdk';

   const pinata = new pinataSDK({
     pinataApiKey: process.env.PINATA_API_KEY!,
     pinataSecretApiKey: process.env.PINATA_SECRET_KEY!
   });

   export async function uploadMetadata(metadata: any) {
     const result = await pinata.pinJSONToIPFS(metadata);
     return `ipfs://${result.IpfsHash}`;
   }
   ```

---

### 3.3 NFT元数据标准

**ERC-721元数据格式**：
```json
{
  "name": "票次元门票 #12345",
  "description": "周杰伦演唱会 VIP票 - 第1排第5座",
  "image": "ipfs://QmXXXXX/ticket-image.png",
  "external_url": "https://piaociyuan.com/nft/12345",
  "attributes": [
    {
      "trait_type": "Event",
      "value": "周杰伦演唱会"
    },
    {
      "trait_type": "Venue",
      "value": "国家体育场（鸟巢）"
    },
    {
      "trait_type": "Date",
      "value": "2025-06-15"
    },
    {
      "trait_type": "Tier",
      "value": "VIP看台"
    },
    {
      "trait_type": "Section",
      "value": "A区"
    },
    {
      "trait_type": "Row",
      "value": "1"
    },
    {
      "trait_type": "Seat",
      "value": "5"
    },
    {
      "display_type": "date",
      "trait_type": "Minted At",
      "value": 1717574400
    }
  ]
}
```

---

## 四、铸造队列处理器（必需）

### 4.1 实现真实区块链铸造

**位置**：`lib/nft-minter.ts`

**功能**：
- 连接区块链节点
- 调用智能合约mint方法
- 处理交易确认
- 错误重试机制

**参考代码**：
```typescript
import { ethers } from 'ethers';
import prisma from './prisma';

const provider = new ethers.providers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL
);

const wallet = new ethers.Wallet(
  process.env.MINT_WALLET_PRIVATE_KEY!,
  provider
);

// 合约ABI（从编译后的合约中获取）
const contractABI = [...]; // 填入实际ABI

const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS!,
  contractABI,
  wallet
);

export async function mintNFT(queueId: string) {
  const queueItem = await prisma.nFTMintQueue.findUnique({
    where: { id: queueId },
    include: { order: true }
  });

  if (!queueItem) throw new Error('Queue item not found');

  try {
    // 1. 准备元数据
    const metadata = {
      name: `票次元门票 #${queueItem.orderId}`,
      // ... 完整元数据
    };

    // 2. 上传到IPFS
    const metadataUri = await uploadMetadata(metadata);

    // 3. 调用智能合约铸造
    const tx = await nftContract.mint(
      queueItem.walletAddress,
      queueItem.orderId,
      queueItem.eventId,
      metadataUri
    );

    // 4. 等待交易确认
    const receipt = await tx.wait();

    // 5. 提取tokenId（从事件日志）
    const mintEvent = receipt.events?.find((e: any) => e.event === 'Transfer');
    const tokenId = mintEvent?.args?.tokenId?.toNumber();

    // 6. 更新数据库
    await prisma.$transaction([
      prisma.order.update({
        where: { id: queueItem.orderId },
        data: {
          nftStatus: 'minted',
          nftTokenId: tokenId,
          nftTransactionHash: receipt.transactionHash,
          nftMintedAt: new Date()
        }
      }),
      prisma.nFTMintQueue.update({
        where: { id: queueId },
        data: {
          status: 'completed',
          processedAt: new Date()
        }
      }),
      prisma.userNFTAsset.create({
        data: {
          userId: queueItem.userId,
          orderId: queueItem.orderId,
          eventId: queueItem.eventId,
          tierId: queueItem.tierId,
          contractAddress: process.env.NFT_CONTRACT_ADDRESS!,
          tokenId: tokenId,
          metadataUri: metadataUri,
          currentOwnerAddress: queueItem.walletAddress,
          mintedAt: new Date()
        }
      })
    ]);

    return { success: true, tokenId, txHash: receipt.transactionHash };
  } catch (error) {
    // 错误处理和重试逻辑
    await prisma.nFTMintQueue.update({
      where: { id: queueId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        retryCount: { increment: 1 }
      }
    });
    throw error;
  }
}
```

---

### 4.2 后台队列处理服务

**方案1：使用BullMQ（推荐）**

```bash
npm install bullmq ioredis
```

**创建队列处理器** `workers/nft-mint-worker.ts`：
```typescript
import { Worker } from 'bullmq';
import { mintNFT } from '@/lib/nft-minter';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

const worker = new Worker(
  'nft-mint-queue',
  async (job) => {
    console.log(`Processing NFT mint for queue ID: ${job.data.queueId}`);
    return await mintNFT(job.data.queueId);
  },
  {
    connection,
    concurrency: 5, // 并发处理5个任务
    limiter: {
      max: 10, // 每分钟最多10个
      duration: 60000
    }
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('🚀 NFT Mint Worker started');
```

**启动worker**：
```bash
npx tsx workers/nft-mint-worker.ts
```

**方案2：使用Cron定时任务（简单方案）**

创建 `scripts/process-nft-queue.ts`：
```typescript
import prisma from '@/lib/prisma';
import { mintNFT } from '@/lib/nft-minter';

async function processQueue() {
  // 获取待处理的队列项
  const pending = await prisma.nFTMintQueue.findMany({
    where: {
      status: 'pending',
      retryCount: { lt: 3 } // 最多重试3次
    },
    take: 10,
    orderBy: { createdAt: 'asc' }
  });

  for (const item of pending) {
    try {
      await mintNFT(item.id);
    } catch (error) {
      console.error(`Failed to mint NFT for queue ${item.id}:`, error);
    }
  }
}

// 每30秒执行一次
setInterval(processQueue, 30000);

processQueue(); // 立即执行一次
```

**使用PM2运行**：
```bash
npm install -g pm2
pm2 start npx --name nft-worker -- tsx scripts/process-nft-queue.ts
pm2 save
```

---

## 五、前端集成（部分完成）

### 5.1 已完成
- ✅ 钱包连接按钮组件
- ✅ NFT铸造按钮组件
- ✅ 我的NFT列表页面基础结构

### 5.2 待完成

#### 5.2.1 在订单详情页集成NFT功能

**位置**：`app/order/[id]/ui/OrderClient.tsx`

**步骤**：
1. 导入NFT组件
   ```tsx
   import { OrderNFTSection } from '@/components/NFTComponents';
   ```

2. 在订单详情页面添加NFT区域
   ```tsx
   {order.status === 'paid' && (
     <OrderNFTSection order={order} />
   )}
   ```

#### 5.2.2 完善NFT资产展示页面

**位置**：`app/account/nfts/page.tsx`

**功能**：
- 显示用户所有NFT
- 点击查看详情
- 显示OpenSea链接
- 显示区块浏览器链接
- 转移NFT功能（可选）

#### 5.2.3 NFT详情页

**位置**：`app/account/nfts/[tokenId]/page.tsx`（新建）

**功能**：
- 显示NFT完整元数据
- 显示持有历史
- 显示交易记录
- 分享到社交媒体

---

## 六、测试计划

### 6.1 本地测试（Hardhat Network）

```bash
# 启动本地区块链
npx hardhat node

# 部署到本地
npx hardhat run scripts/deploy-nft-contract.js --network localhost

# 运行测试
npx hardhat test
```

### 6.2 测试网测试

**测试流程**：
1. 使用测试账号登录
2. 购买一张测试票（使用测试支付）
3. 连接MetaMask钱包（切换到Amoy测试网）
4. 点击"转为NFT"按钮
5. 等待铸造完成（约30秒-2分钟）
6. 在"我的NFT"页面查看
7. 在OpenSea测试网查看：https://testnets.opensea.io/

### 6.3 主网测试（小规模）

**步骤**：
1. 给平台钱包充值少量MATIC（约10-20 MATIC）
2. 限制每日铸造数量（如10个）
3. 选择测试用户进行真实铸造
4. 监控gas费用和交易状态
5. 验证OpenSea显示正常

---

## 七、生产环境部署

### 7.1 环境变量配置

**生产环境 `.env.production`**：
```env
# 数据库
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="strong-random-secret"

# 区块链（主网）
BLOCKCHAIN_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BLOCKCHAIN_CHAIN_ID=137
NFT_CONTRACT_ADDRESS=0xYOUR_MAINNET_CONTRACT
MINT_WALLET_PRIVATE_KEY=0xYOUR_PRODUCTION_WALLET

# IPFS
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key

# Redis（用于队列）
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# NFT功能开关
NFT_ENABLED=true
```

### 7.2 部署检查清单

- [ ] 智能合约已部署到主网
- [ ] 智能合约已在PolygonScan验证
- [ ] 平台钱包已充值足够MATIC
- [ ] Redis服务正常运行
- [ ] NFT Worker服务已启动
- [ ] IPFS/Pinata配置正确
- [ ] 所有环境变量已设置
- [ ] 数据库迁移已执行
- [ ] 错误监控已配置（Sentry等）
- [ ] 备份策略已制定

---

## 八、监控与维护

### 8.1 关键指标监控

**需要监控的指标**：
1. NFT铸造成功率
2. 平均铸造时间
3. Gas费用消耗
4. 队列积压数量
5. 失败重试次数
6. 平台钱包余额

**工具推荐**：
- Grafana + Prometheus
- Datadog
- New Relic

### 8.2 告警设置

**告警规则**：
- 平台钱包余额低于阈值（如5 MATIC）
- NFT铸造失败率超过5%
- 队列积压超过100个
- Worker服务宕机

---

## 九、成本估算

### 9.1 Gas费用

**Polygon主网gas费用（参考）**：
- 单次NFT铸造：约0.01-0.05 MATIC
- MATIC价格：约$0.5-1.0
- 单次铸造成本：约$0.005-0.05

**月度成本估算**：
- 1000次铸造/月：$5-50
- 10000次铸造/月：$50-500

### 9.2 基础设施成本

- Redis服务：$10-30/月
- IPFS存储（Pinata）：
  - 免费套餐：1GB
  - 付费套餐：$20/月起（100GB）
- RPC节点（Alchemy）：
  - 免费套餐：300M请求/月
  - 付费套餐：$49/月起

---

## 十、风险与应对

### 10.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 智能合约漏洞 | 高 | 代码审计、测试网充分测试 |
| RPC节点故障 | 中 | 配置备用节点、实现自动切换 |
| IPFS数据丢失 | 中 | 使用Pinata等付费服务、多节点备份 |
| Gas费暴涨 | 低 | 监控gas价格、设置最大gas限制 |
| 钱包私钥泄露 | 高 | 使用密钥管理服务、定期轮换 |

### 10.2 业务风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 用户不理解NFT | 中 | 提供详细教程、客服支持 |
| NFT无二级市场 | 低 | 主要定位收藏而非投资 |
| 监管政策变化 | 高 | 关注政策动向、保留关闭开关 |

---

## 十一、时间规划建议

### Phase 1: 基础设施（1-2周）
- [ ] 区块链RPC配置
- [ ] 智能合约开发和部署
- [ ] IPFS存储配置
- [ ] 平台钱包设置

### Phase 2: 核心功能（1-2周）
- [ ] 实现真实铸造逻辑
- [ ] 队列处理服务
- [ ] 元数据生成和上传
- [ ] 错误处理和重试

### Phase 3: 测试验证（1周）
- [ ] 本地测试
- [ ] 测试网部署和测试
- [ ] 压力测试
- [ ] 安全审计

### Phase 4: 生产部署（1周）
- [ ] 主网小规模测试
- [ ] 监控系统搭建
- [ ] 文档和培训
- [ ] 正式上线

**总计：4-6周**

---

## 十二、参考资源

### 官方文档
- Polygon文档：https://docs.polygon.technology/
- ethers.js文档：https://docs.ethers.org/
- OpenZeppelin合约库：https://docs.openzeppelin.com/
- ERC-721标准：https://eips.ethereum.org/EIPS/eip-721
- OpenSea元数据标准：https://docs.opensea.io/docs/metadata-standards

### 工具和服务
- Alchemy：https://www.alchemy.com/
- Pinata（IPFS）：https://www.pinata.cloud/
- Hardhat：https://hardhat.org/
- BullMQ：https://docs.bullmq.io/

### 测试网资源
- Polygon Amoy水龙头：https://faucet.polygon.technology/
- Amoy区块浏览器：https://amoy.polygonscan.com/
- OpenSea测试网：https://testnets.opensea.io/

---

## 联系方式

如有问题，请联系开发团队或查阅相关文档。

**文档版本**：v1.0
**最后更新**：2025-11-02
