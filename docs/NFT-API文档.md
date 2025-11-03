# NFT API 文档

本文档描述了票次元平台的 NFT（数字藏品）相关 API 接口。

## 目录

- [认证说明](#认证说明)
- [NFT 资产 API](#nft-资产-api)
- [NFT 铸造 API](#nft-铸造-api)
- [钱包管理 API](#钱包管理-api)
- [用户 NFT 收藏 API](#用户-nft-收藏-api)
- [数据模型](#数据模型)
- [错误码](#错误码)

---

## 认证说明

所有 API 请求都需要在 HTTP Header 中包含 Bearer Token：

```
Authorization: Bearer <access_token>
```

如果认证失败，将返回 401 状态码和错误信息。

---

## NFT 资产 API

### 1. 获取我的 NFT 列表

**接口**: `GET /api/nft/assets/my`

**功能**: 获取当前用户拥有的所有已铸造的 NFT 资产

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "total": 5,
  "assets": [
    {
      "id": "user-nft-uuid",
      "tokenId": 1234,
      "contractAddress": "0x...",
      "name": "周杰伦演唱会3D票根NFT",
      "imageUrl": "https://...",
      "description": "周杰伦 - 2025-12-31",
      "orderNumber": "order-uuid",
      "metadataUri": "ipfs://...",
      "mintedAt": "2025-11-02T10:00:00.000Z",
      "isTransferred": false,
      "openseaUrl": "https://testnets.opensea.io/assets/...",
      "explorerUrl": "https://mumbai.polygonscan.com/token/...",
      "rarity": "epic",
      "category": "ticket_stub",
      "has3DModel": true,
      "hasAR": false
    }
  ]
}
```

**字段说明**:
- `tokenId`: NFT 的 Token ID
- `contractAddress`: 智能合约地址
- `rarity`: 稀有度（common/rare/epic/legendary）
- `category`: 类别（badge/ticket_stub/poster/certificate/art）
- `has3DModel`: 是否有 3D 模型
- `hasAR`: 是否支持 AR 功能

---

### 2. 获取单个 NFT 详情

**接口**: `GET /api/nft/assets/[tokenId]`

**功能**: 获取指定 Token ID 的 NFT 详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `tokenId`: NFT 的 Token ID

**响应示例**:
```json
{
  "asset": {
    "id": "user-nft-uuid",
    "tokenId": 1234,
    "contractAddress": "0x...",
    "nft": {
      "id": "nft-uuid",
      "name": "周杰伦演唱会3D票根NFT",
      "description": "专属3D数字票根，永久收藏",
      "imageUrl": "https://...",
      "rarity": "epic",
      "category": "ticket_stub",
      "has3DModel": true,
      "model3DUrl": "https://...",
      "modelFormat": "gltf",
      "totalSupply": 350,
      "mintedCount": 120
    },
    "event": {
      "id": 1,
      "name": "周杰伦演唱会",
      "venue": "北京国家体育场",
      "date": "2025-12-31",
      "time": "19:00"
    },
    "tier": {
      "id": 101,
      "name": "VIP座",
      "price": 1280
    }
  }
}
```

---

## NFT 铸造 API

### 1. 请求铸造 NFT

**接口**: `POST /api/nft/mint/request`

**功能**: 将已购买的票转换为 NFT 数字藏品

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "ticketId": "ticket-uuid"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "NFT铸造请求已提交，预计5秒完成（模拟）",
  "userNftId": "user-nft-uuid",
  "queueId": "queue-uuid",
  "estimatedTime": "5秒（占位符）"
}
```

**错误响应**:
```json
{
  "error": "请先绑定钱包地址"
}
```

**业务规则**:
1. 票必须已购买（status = 'sold'）
2. 票必须支持 NFT 功能（nftId 不为空）
3. 用户必须已绑定钱包地址
4. 同一张票只能铸造一次

---

### 2. 查询铸造状态

**接口**: `GET /api/nft/mint/status/[ticketId]`

**功能**: 查询票的 NFT 铸造进度

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `ticketId`: 票的 ID（注意：虽然参数名为 orderId，但应传入 ticketId）

**响应示例**:
```json
{
  "ticketStatus": "minted",
  "mintStatus": "minted",
  "tokenId": 1234,
  "transactionHash": "0x...",
  "mintedAt": "2025-11-02T10:05:00.000Z",
  "queueStatus": "completed",
  "error": null,
  "retryCount": 0
}
```

**状态说明**:
- `ticketStatus`: 票的铸造状态（pending/minting/minted/failed）
- `mintStatus`: UserNFT 的铸造状态（pending/minting/minted/failed）
- `queueStatus`: 队列状态（pending/processing/completed/failed）

---

## 钱包管理 API

### 1. 绑定钱包

**接口**: `POST /api/nft/wallet/bind`

**功能**: 绑定用户的 Web3 钱包地址

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "签名消息内容",
  "walletType": "metamask"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "钱包绑定成功",
  "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
}
```

**签名验证**:
- 使用 ethers.js 的 `verifyMessage` 方法验证签名
- 确保签名者地址与提交的钱包地址一致
- 防止钱包被多个账号绑定

---

### 2. 查询钱包状态

**接口**: `GET /api/nft/wallet/status`

**功能**: 查询当前用户的钱包绑定状态

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "connected": true,
  "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "walletType": "metamask",
  "connectedAt": "2025-11-01T10:00:00.000Z"
}
```

---

## 用户 NFT 收藏 API

### 1. 获取用户的 NFT 收藏

**接口**: `GET /api/user/nfts`

**功能**: 获取用户的 NFT 收藏列表，支持筛选

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `rarity`: 稀有度筛选（common/rare/epic/legendary）
- `category`: 类别筛选（badge/ticket_stub/poster/certificate/art）
- `sourceType`: 来源筛选（ticket_purchase/direct_purchase/airdrop/transfer）
- `mintStatus`: 铸造状态（pending/minting/minted/failed）
- `isOnChain`: 是否已上链（true/false）

**示例**:
```
GET /api/user/nfts?rarity=epic&category=ticket_stub
```

**响应示例**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "user-nft-uuid",
      "nft": {
        "id": "nft-uuid",
        "name": "周杰伦演唱会3D票根NFT",
        "description": "专属3D数字票根",
        "imageUrl": "https://...",
        "rarity": "epic",
        "category": "ticket_stub",
        "has3DModel": true,
        "model3DUrl": "https://...",
        "totalSupply": 350,
        "mintedCount": 120
      },
      "ownerWalletAddress": "0x...",
      "contractAddress": "0x...",
      "tokenId": 1234,
      "mintStatus": "minted",
      "isOnChain": true,
      "mintedAt": "2025-11-02T10:05:00.000Z",
      "mintTransactionHash": "0x...",
      "sourceType": "ticket_purchase",
      "sourceId": "ticket-uuid",
      "obtainedAt": "2025-11-02T10:00:00.000Z",
      "metadata": {},
      "metadataUri": "ipfs://..."
    }
  ],
  "stats": {
    "total": 10,
    "byRarity": {
      "legendary": 1,
      "epic": 3,
      "rare": 4,
      "common": 2
    },
    "byCategory": {
      "badge": 2,
      "ticket_stub": 5,
      "poster": 2,
      "certificate": 1,
      "art": 0
    },
    "byMintStatus": {
      "pending": 1,
      "minting": 0,
      "minted": 9,
      "failed": 0
    },
    "has3D": 5,
    "hasAR": 2,
    "onChain": 9
  }
}
```

---

### 2. 获取单个 NFT 收藏详情

**接口**: `GET /api/user/nfts/[id]`

**功能**: 获取指定 UserNFT 的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: UserNFT 的 ID

**响应示例**:
```json
{
  "ok": true,
  "data": {
    "id": "user-nft-uuid",
    "nft": {
      "id": "nft-uuid",
      "name": "周杰伦演唱会3D票根NFT",
      "description": "专属3D数字票根，永久收藏",
      "imageUrl": "https://...",
      "rarity": "epic",
      "category": "ticket_stub",
      "has3DModel": true,
      "model3DUrl": "https://...",
      "modelFormat": "gltf",
      "totalSupply": 350,
      "mintedCount": 120,
      "price": null,
      "isMarketable": false,
      "contractAddress": "0x...",
      "eventId": 1,
      "tierId": 101
    },
    "owner": {
      "id": "user-uuid",
      "nickname": "用户昵称",
      "avatar": "https://...",
      "walletAddress": "0x..."
    },
    "ownerWalletAddress": "0x...",
    "contractAddress": "0x...",
    "tokenId": 1234,
    "metadataUri": "ipfs://...",
    "mintStatus": "minted",
    "isOnChain": true,
    "mintTransactionHash": "0x...",
    "mintedAt": "2025-11-02T10:05:00.000Z",
    "mintError": null,
    "isTransferred": false,
    "transferredTo": null,
    "transferredAt": null,
    "sourceType": "ticket_purchase",
    "sourceId": "ticket-uuid",
    "obtainedAt": "2025-11-02T10:00:00.000Z",
    "lastSyncedAt": "2025-11-02T12:00:00.000Z",
    "metadata": {}
  }
}
```

---

## 数据模型

### NFT 模型

NFT 主表，定义了 NFT 的基本信息和属性。

```typescript
{
  id: string;              // UUID
  name: string;            // NFT 名称
  description: string;     // 描述
  imageUrl: string;        // 图片 URL
  sourceType: string;      // 来源类型: ticket_reward, standalone, airdrop
  category: string;        // 类别: badge, ticket_stub, poster, certificate, art
  eventId?: number;        // 关联活动 ID（可选）
  tierId?: number;         // 关联票档 ID（可选）
  rarity: string;          // 稀有度: common, rare, epic, legendary
  price?: number;          // 独立售卖价格（可选）
  totalSupply: number;     // 总供应量
  mintedCount: number;     // 已铸造数量
  // 3D/AR 功能
  has3DModel: boolean;     // 是否有 3D 模型
  model3DUrl?: string;     // 3D 模型 URL
  modelFormat?: string;    // 模型格式: gltf, fbx
  hasAR: boolean;          // 是否支持 AR
  arUrl?: string;          // AR 资源 URL
  hasAnimation: boolean;   // 是否有动画
  animationUrl?: string;   // 动画 URL
  // 区块链信息
  contractAddress?: string;      // 合约地址
  tokenIdStart?: number;         // Token ID 起始值
  metadataUriTemplate?: string;  // 元数据 URI 模板
  // 状态控制
  isActive: boolean;       // 是否激活
  isMintable: boolean;     // 是否可铸造
  isMarketable: boolean;   // 是否可交易
  createdAt: Date;
  updatedAt: Date;
}
```

### UserNFT 模型

用户拥有的 NFT 资产记录。

```typescript
{
  id: string;                    // UUID
  userId: string;                // 用户 ID
  nftId: string;                 // NFT ID
  // 获得方式
  sourceType: string;            // ticket_purchase, direct_purchase, airdrop, transfer
  sourceId?: string;             // 来源 ID（票 ID、订单 ID 等）
  // 区块链唯一标识
  contractAddress: string;       // 合约地址
  tokenId: number;               // Token ID
  metadataUri?: string;          // 元数据 URI
  // 所有权信息
  ownerWalletAddress: string;    // 当前链上所有者钱包地址
  isOnChain: boolean;            // 是否已上链
  // 铸造信息
  mintStatus: string;            // pending, minting, minted, failed
  mintTransactionHash?: string;  // 铸造交易哈希
  mintedAt?: Date;               // 铸造时间
  mintError?: string;            // 铸造错误信息
  // 转移信息
  isTransferred: boolean;        // 是否已转移
  transferredTo?: string;        // 转移目标地址
  transferredAt?: Date;          // 转移时间
  // 额外数据
  metadata?: string;             // JSON 格式的元数据
  obtainedAt: Date;              // 获得时间
  lastSyncedAt?: Date;           // 最后同步时间
}
```

### Ticket 模型（NFT 相关字段）

票务表中与 NFT 相关的字段。

```typescript
{
  // ... 其他票务字段
  // NFT 绑定字段
  nftId?: string;              // 绑定的 NFT ID
  nftMintStatus?: string;      // NFT 铸造状态: pending, minting, minted, failed
  nftUserNftId?: string;       // 对应的 UserNFT 记录 ID
}
```

---

## 错误码

### 通用错误

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权，Token 无效或已过期 |
| `BAD_REQUEST` | 请求参数错误 |
| `NOT_FOUND` | 资源不存在 |
| `SERVER_ERROR` | 服务器内部错误 |

### NFT 特定错误

| 错误信息 | 说明 |
|----------|------|
| "票不存在" | 指定的票 ID 不存在或不属于当前用户 |
| "票尚未售出" | 票必须先购买才能铸造 NFT |
| "该票不支持NFT功能" | 票未绑定任何 NFT |
| "NFT已经铸造" | 该票的 NFT 已经铸造完成 |
| "请先绑定钱包地址" | 用户必须先绑定钱包才能铸造 NFT |
| "该钱包已被其他账户绑定" | 钱包地址已被其他用户绑定 |
| "签名验证失败" | 钱包签名验证不通过 |

---

## 最佳实践

### 1. NFT 铸造流程

```javascript
// 1. 检查钱包状态
const walletStatus = await fetch('/api/nft/wallet/status', {
  headers: { Authorization: `Bearer ${token}` }
});

if (!walletStatus.connected) {
  // 2. 引导用户绑定钱包
  await connectWallet();
}

// 3. 请求铸造 NFT
const mintResult = await fetch('/api/nft/mint/request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ticketId: 'ticket-uuid' })
});

// 4. 轮询铸造状态
const checkStatus = setInterval(async () => {
  const status = await fetch(`/api/nft/mint/status/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (status.mintStatus === 'minted') {
    clearInterval(checkStatus);
    console.log('NFT铸造成功！');
  }
}, 2000);
```

### 2. 展示 NFT 收藏

```javascript
// 获取用户的 NFT 收藏
const nfts = await fetch('/api/user/nfts?rarity=epic', {
  headers: { Authorization: `Bearer ${token}` }
});

// 按稀有度排序展示
const sorted = nfts.data.sort((a, b) => {
  const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
  return rarityOrder[b.nft.rarity] - rarityOrder[a.nft.rarity];
});
```

---

## 注意事项

1. **测试环境**: 当前 NFT 铸造功能使用模拟实现，5秒后自动完成
2. **区块链网络**: 生产环境应配置真实的智能合约地址和区块链网络
3. **Gas 费用**: 实际铸造时需要考虑 Gas 费用，建议由平台承担
4. **元数据存储**: 建议使用 IPFS 或 Arweave 等去中心化存储
5. **安全性**: 钱包签名验证确保钱包所有权，防止恶意绑定

---

## 🚀 真实接入NFT完整指南

> ⚠️ **当前状态**: 系统使用模拟铸造（5秒后自动完成）
> 📝 **本指南**: 用于未来真实接入区块链NFT时的完整步骤参考

---

### 阶段1：准备工作

#### 1.1 选择区块链网络

**推荐选择：**
- **测试环境**: Polygon Mumbai（免费、快速）
- **生产环境**: Polygon PoS（低gas、高性能）

**为什么选择Polygon？**
- ✅ Gas费极低（$0.001 - $0.01）
- ✅ 交易速度快（2秒确认）
- ✅ 兼容以太坊（EVM兼容）
- ✅ OpenSea原生支持

**其他选择：**
- Ethereum（主网，gas高，适合高价值NFT）
- BSC（币安智能链，亚洲用户多）
- Arbitrum/Optimism（Layer 2，低费用）

#### 1.2 准备钱包

```bash
# 1. 创建项目专用钱包
# 使用MetaMask或生成新的私钥
# 保存助记词到安全的地方（1Password/Bitwarden）

# 2. 获取测试币（Mumbai测试网）
# 访问：https://faucet.polygon.technology/
# 领取免费的MATIC测试币

# 3. 设置环境变量
DEPLOYER_PRIVATE_KEY="0x..."  # 部署合约的钱包私钥
MINTER_PRIVATE_KEY="0x..."     # 铸造NFT的钱包私钥（最好分开）
```

---

### 阶段2：智能合约开发与部署

#### 2.1 安装依赖

```bash
npm install --save-dev hardhat @openzeppelin/contracts
npm install ethers@^5.7.0
```

#### 2.2 创建智能合约

在项目根目录创建 `contracts/PiaoCiYuanNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title 票次元NFT合约
 * @notice 用于票务验证后领取独立的3D/AR数字艺术品
 */
contract PiaoCiYuanNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // 映射：票ID => Token ID（防止重复铸造）
    mapping(string => uint256) public ticketToToken;

    // 映射：NFT类型ID => 基础元数据URI
    mapping(string => string) public nftTypeBaseURI;

    // 事件
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        string ticketId,
        string nftTypeId
    );

    constructor() ERC721("PiaoCiYuan NFT", "PCY") {}

    /**
     * @notice 为验票后的用户铸造NFT
     * @param to 接收者钱包地址
     * @param ticketId 票ID（防止重复）
     * @param nftTypeId NFT类型ID
     * @param metadataURI 元数据URI（IPFS）
     */
    function mintTicketNFT(
        address to,
        string memory ticketId,
        string memory nftTypeId,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        // 检查该票是否已铸造
        require(ticketToToken[ticketId] == 0, "Ticket already minted");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        ticketToToken[ticketId] = newTokenId;

        emit NFTMinted(to, newTokenId, ticketId, nftTypeId);

        return newTokenId;
    }

    /**
     * @notice 批量铸造（gas优化）
     */
    function batchMintTicketNFT(
        address[] memory recipients,
        string[] memory ticketIds,
        string[] memory nftTypeIds,
        string[] memory metadataURIs
    ) public onlyOwner {
        require(
            recipients.length == ticketIds.length &&
            ticketIds.length == nftTypeIds.length &&
            nftTypeIds.length == metadataURIs.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            mintTicketNFT(
                recipients[i],
                ticketIds[i],
                nftTypeIds[i],
                metadataURIs[i]
            );
        }
    }

    /**
     * @notice 检查票是否已铸造
     */
    function isTicketMinted(string memory ticketId)
        public
        view
        returns (bool)
    {
        return ticketToToken[ticketId] != 0;
    }

    /**
     * @notice 获取票对应的Token ID
     */
    function getTokenByTicket(string memory ticketId)
        public
        view
        returns (uint256)
    {
        return ticketToToken[ticketId];
    }
}
```

#### 2.3 配置Hardhat

创建 `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 80001
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 137
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
```

#### 2.4 部署脚本

创建 `scripts/deploy-nft.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 PiaoCiYuan NFT 合约...");

  const PiaoCiYuanNFT = await hre.ethers.getContractFactory("PiaoCiYuanNFT");
  const nft = await PiaoCiYuanNFT.deploy();

  await nft.deployed();

  console.log("✅ 合约已部署到:", nft.address);
  console.log("📝 请将以下地址添加到 .env:");
  console.log(`NFT_CONTRACT_ADDRESS=${nft.address}`);

  // 等待几个区块确认
  console.log("⏳ 等待区块确认...");
  await nft.deployTransaction.wait(5);

  // 验证合约（可选）
  console.log("🔍 验证合约...");
  await hre.run("verify:verify", {
    address: nft.address,
    constructorArguments: [],
  });

  console.log("🎉 部署完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### 2.5 执行部署

```bash
# 测试网部署
npx hardhat run scripts/deploy-nft.js --network mumbai

# 生产网部署（谨慎！）
npx hardhat run scripts/deploy-nft.js --network polygon
```

---

### 阶段3：IPFS元数据存储

#### 3.1 选择IPFS服务

**推荐服务：**
- **Pinata** (https://pinata.cloud) - 免费1GB，易用
- **NFT.Storage** (https://nft.storage) - 免费无限，专为NFT设计
- **Infura IPFS** - 与Infura账号集成

#### 3.2 创建元数据上传工具

创建 `lib/ipfs.ts`:

```typescript
import { create } from 'ipfs-http-client';
import FormData from 'form-data';
import axios from 'axios';

/**
 * 使用Pinata上传到IPFS
 */
export async function uploadToPinata(data: any) {
  const pinataApiKey = process.env.PINATA_API_KEY!;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY!;

  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

  const response = await axios.post(url, data, {
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretKey,
      'Content-Type': 'application/json'
    }
  });

  return `ipfs://${response.data.IpfsHash}`;
}

/**
 * 生成NFT元数据
 */
export function generateNFTMetadata(nft: any, event: any, tier: any) {
  return {
    name: nft.name,
    description: nft.description,
    image: nft.imageUrl, // 或者也上传到IPFS
    external_url: `https://piaociyuan.com/nfts/${nft.id}`,
    attributes: [
      { trait_type: "Event", value: event.name },
      { trait_type: "Venue", value: event.venue },
      { trait_type: "Date", value: event.date },
      { trait_type: "Tier", value: tier.name },
      { trait_type: "Rarity", value: nft.rarity },
      { trait_type: "Category", value: nft.category },
    ],
    // 3D模型
    animation_url: nft.model3DUrl || null,
    // AR支持
    ar_url: nft.arUrl || null,
    // 自定义属性
    properties: {
      has3DModel: nft.has3DModel,
      hasAR: nft.hasAR,
      totalSupply: nft.totalSupply,
      mintedCount: nft.mintedCount + 1
    }
  };
}
```

---

### 阶段4：后端接入真实铸造

#### 4.1 安装Web3依赖

```bash
npm install ethers@^5.7.0
```

#### 4.2 创建合约交互工具

创建 `lib/nft-contract.ts`:

```typescript
import { ethers } from 'ethers';

const NFT_ABI = [
  "function mintTicketNFT(address to, string memory ticketId, string memory nftTypeId, string memory metadataURI) public returns (uint256)",
  "function isTicketMinted(string memory ticketId) public view returns (bool)",
  "event NFTMinted(address indexed to, uint256 indexed tokenId, string ticketId, string nftTypeId)"
];

export class NFTContract {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;

  constructor() {
    // 连接到Polygon网络
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"
    );

    // 铸造钱包
    this.signer = new ethers.Wallet(
      process.env.MINTER_PRIVATE_KEY!,
      this.provider
    );

    // 合约实例
    this.contract = new ethers.Contract(
      process.env.NFT_CONTRACT_ADDRESS!,
      NFT_ABI,
      this.signer
    );
  }

  /**
   * 铸造NFT
   */
  async mintNFT(
    toAddress: string,
    ticketId: string,
    nftTypeId: string,
    metadataURI: string
  ): Promise<{ tokenId: number; txHash: string }> {
    try {
      // 检查是否已铸造
      const isMinted = await this.contract.isTicketMinted(ticketId);
      if (isMinted) {
        throw new Error('该票已经铸造过NFT');
      }

      // 估算Gas
      const gasEstimate = await this.contract.estimateGas.mintTicketNFT(
        toAddress,
        ticketId,
        nftTypeId,
        metadataURI
      );

      // 执行铸造
      const tx = await this.contract.mintTicketNFT(
        toAddress,
        ticketId,
        nftTypeId,
        metadataURI,
        {
          gasLimit: gasEstimate.mul(120).div(100) // 增加20%余量
        }
      );

      console.log('⏳ 交易已提交:', tx.hash);

      // 等待确认
      const receipt = await tx.wait(2); // 等待2个区块确认

      console.log('✅ 交易已确认:', receipt.transactionHash);

      // 从事件中获取Token ID
      const event = receipt.events?.find((e: any) => e.event === 'NFTMinted');
      const tokenId = event?.args?.tokenId.toNumber();

      return {
        tokenId,
        txHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('❌ 铸造失败:', error);
      throw new Error(`铸造失败: ${error.message}`);
    }
  }

  /**
   * 批量铸造（gas优化）
   */
  async batchMintNFT(mintRequests: Array<{
    toAddress: string;
    ticketId: string;
    nftTypeId: string;
    metadataURI: string;
  }>): Promise<string> {
    // 实现批量铸造逻辑...
    throw new Error('批量铸造待实现');
  }
}

// 单例
export const nftContract = new NFTContract();
```

#### 4.3 修改铸造API

修改 `app/api/nft/mint/request/route.ts`:

```typescript
import { nftContract } from '@/lib/nft-contract';
import { uploadToPinata, generateNFTMetadata } from '@/lib/ipfs';

export async function POST(req: NextRequest) {
  try {
    // ... 前面的验证逻辑不变 ...

    // 🔴 删除模拟铸造的setTimeout
    // ✅ 替换为真实铸造

    // 1. 获取NFT、活动、票档信息
    const nft = await prisma.nFT.findUnique({
      where: { id: ticket.nftId! },
      include: {
        event: true,
        tier: true
      }
    });

    // 2. 生成元数据
    const metadata = generateNFTMetadata(nft, nft.event, nft.tier);

    // 3. 上传元数据到IPFS
    const metadataURI = await uploadToPinata(metadata);
    console.log('📦 元数据已上传:', metadataURI);

    // 4. 创建UserNFT记录（状态：pending）
    const userNFT = await prisma.userNFT.create({
      data: {
        userId: userId,
        nftId: ticket.nftId,
        sourceType: 'ticket_purchase',
        sourceId: ticketId,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS!,
        tokenId: 0, // 稍后更新
        ownerWalletAddress: walletAddress,
        mintStatus: 'pending',
        metadataUri: metadataURI,
      },
    });

    // 5. 添加到队列
    const queueItem = await prisma.nFTMintQueue.create({
      data: {
        userNftId: userNFT.id,
        userId: userId,
        walletAddress: walletAddress,
        status: "pending",
      },
    });

    // 6. 更新票状态
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        nftMintStatus: "pending",
        nftUserNftId: userNFT.id,
      },
    });

    // 7. 异步执行真实铸造
    // 使用队列系统（推荐BullMQ）或后台任务
    executeRealMinting(userNFT.id, ticket.id, walletAddress, metadataURI)
      .catch(err => console.error('铸造失败:', err));

    return NextResponse.json({
      success: true,
      message: "次元领取请求已提交，预计1-3分钟完成链上铸造",
      userNftId: userNFT.id,
      queueId: queueItem.id,
      estimatedTime: "1-3分钟",
    });

  } catch (error) {
    console.error("次元领取错误:", error);
    return NextResponse.json(
      { error: "请求失败，请重试" },
      { status: 500 }
    );
  }
}

/**
 * 执行真实的链上铸造
 */
async function executeRealMinting(
  userNftId: string,
  ticketId: string,
  walletAddress: string,
  metadataURI: string
) {
  try {
    // 1. 调用智能合约铸造
    const { tokenId, txHash } = await nftContract.mintNFT(
      walletAddress,
      ticketId,
      'ticket_nft', // nftTypeId
      metadataURI
    );

    console.log(`✅ NFT铸造成功: Token ${tokenId}, TX ${txHash}`);

    // 2. 更新UserNFT状态
    await prisma.userNFT.update({
      where: { id: userNftId },
      data: {
        mintStatus: "minted",
        tokenId: tokenId,
        isOnChain: true,
        mintTransactionHash: txHash,
        mintedAt: new Date(),
      },
    });

    // 3. 更新票状态
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        nftMintStatus: "minted",
      },
    });

    // 4. 更新队列
    await prisma.nFTMintQueue.update({
      where: { userNftId: userNftId },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    });

    // 5. 更新NFT统计
    await prisma.nFT.update({
      where: { id: ticket.nftId! },
      data: {
        mintedCount: { increment: 1 },
      },
    });

  } catch (error: any) {
    console.error('铸造失败:', error);

    // 更新失败状态
    await prisma.userNFT.update({
      where: { id: userNftId },
      data: {
        mintStatus: "failed",
        mintError: error.message,
      },
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        nftMintStatus: "failed",
      },
    });
  }
}
```

---

### 阶段5：环境变量配置

在 `.env` 添加：

```bash
# ============ NFT 区块链配置 ============
# 网络RPC
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com

# 钱包私钥（⚠️ 生产环境使用KMS！）
DEPLOYER_PRIVATE_KEY=0x...  # 部署合约的钱包
MINTER_PRIVATE_KEY=0x...     # 铸造NFT的钱包

# 合约地址
NFT_CONTRACT_ADDRESS=0x...

# IPFS配置
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# 区块链浏览器API（用于验证合约）
POLYGONSCAN_API_KEY=...

# 前端展示用
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=137  # Mumbai=80001, Polygon=137
NEXT_PUBLIC_OPENSEA_BASE_URL=https://opensea.io  # 或 testnets.opensea.io
```

---

### 阶段6：队列系统（推荐）

为了可靠的铸造，推荐使用队列系统：

```bash
npm install bullmq ioredis
```

创建 `lib/mint-queue.ts`:

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const mintQueue = new Queue('nft-minting', { connection });

// Worker处理铸造任务
const worker = new Worker(
  'nft-minting',
  async (job) => {
    const { userNftId, ticketId, walletAddress, metadataURI } = job.data;

    await executeRealMinting(userNftId, ticketId, walletAddress, metadataURI);
  },
  {
    connection,
    concurrency: 3, // 并发处理3个任务
  }
);

worker.on('completed', (job) => {
  console.log(`✅ 任务完成: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ 任务失败: ${job?.id}`, err);
});
```

---

### 阶段7：测试清单

```bash
# ✅ 1. 本地测试
npm run test:nft

# ✅ 2. Mumbai测试网测试
- 部署合约到Mumbai
- 铸造测试NFT
- 检查Polygonscan
- 检查OpenSea测试网

# ✅ 3. 压力测试
- 并发铸造10个NFT
- 检查Gas消耗
- 监控失败率

# ✅ 4. 安全审计
- 合约安全审计（Slither）
- 私钥管理检查
- API安全检查

# ✅ 5. 生产部署
- 部署到Polygon主网
- 小批量测试（10个用户）
- 全面上线
```

---

### 阶段8：监控与优化

#### 8.1 监控指标

```typescript
// lib/nft-monitoring.ts
export const nftMetrics = {
  // Gas消耗
  async trackGasUsed(txHash: string) {
    const receipt = await provider.getTransactionReceipt(txHash);
    const gasUsed = receipt.gasUsed.toNumber();
    const gasPrice = receipt.effectiveGasPrice.toNumber();
    const cost = gasUsed * gasPrice;

    console.log(`⛽ Gas消耗: ${gasUsed}, 费用: ${ethers.utils.formatEther(cost)} MATIC`);
  },

  // 成功率
  async getMintSuccessRate() {
    const total = await prisma.userNFT.count();
    const success = await prisma.userNFT.count({
      where: { mintStatus: 'minted' }
    });
    return (success / total) * 100;
  }
};
```

#### 8.2 成本优化

- 使用批量铸造（batchMint）
- 优化元数据大小
- 使用Layer 2网络
- Gas费监控和动态调整

---

### 快速启动检查清单

完成真实接入需要：

- [ ] Polygon钱包准备（至少10 MATIC）
- [ ] 智能合约部署
- [ ] Pinata账号注册
- [ ] 环境变量配置
- [ ] 修改API铸造逻辑
- [ ] 本地测试通过
- [ ] Mumbai测试网测试
- [ ] 生产环境部署

---

### 参考资源

- **OpenZeppelin合约库**: https://docs.openzeppelin.com/contracts/
- **Hardhat文档**: https://hardhat.org/docs
- **Polygon文档**: https://docs.polygon.technology/
- **Pinata文档**: https://docs.pinata.cloud/
- **OpenSea元数据标准**: https://docs.opensea.io/docs/metadata-standards

---

## 更新日志

### 2025-11-02
- ✅ 创建 NFT API 初版文档
- ✅ 完成 NFT 资产、铸造、钱包管理相关接口文档
- ✅ 添加数据模型说明
- ✅ 添加错误码和最佳实践
- ✅ **新增** 真实接入NFT完整指南（8个阶段详细步骤）

---

如有问题或建议，请联系开发团队。
