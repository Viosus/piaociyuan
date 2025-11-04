-- ==================== 1. 创建 NFTs 主表 ====================
CREATE TABLE IF NOT EXISTS "nfts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "eventId" INTEGER,
  "tierId" INTEGER,
  "rarity" TEXT NOT NULL DEFAULT 'common',
  "price" INTEGER,
  "totalSupply" INTEGER NOT NULL,
  "mintedCount" INTEGER NOT NULL DEFAULT 0,
  "has3DModel" BOOLEAN NOT NULL DEFAULT false,
  "model3DUrl" TEXT,
  "modelFormat" TEXT,
  "hasAR" BOOLEAN NOT NULL DEFAULT false,
  "arUrl" TEXT,
  "hasAnimation" BOOLEAN NOT NULL DEFAULT false,
  "animationUrl" TEXT,
  "modelConfig" TEXT,
  "contractAddress" TEXT,
  "tokenIdStart" INTEGER,
  "metadataUriTemplate" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isMintable" BOOLEAN NOT NULL DEFAULT true,
  "isMarketable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ==================== 2. 创建用户NFT关联表 ====================
CREATE TABLE IF NOT EXISTS "user_nfts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "nftId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "contractAddress" TEXT NOT NULL,
  "tokenId" INTEGER NOT NULL,
  "metadataUri" TEXT,
  "ownerWalletAddress" TEXT NOT NULL,
  "isOnChain" BOOLEAN NOT NULL DEFAULT false,
  "mintStatus" TEXT NOT NULL DEFAULT 'pending',
  "mintTransactionHash" TEXT,
  "mintedAt" TIMESTAMP(3),
  "mintError" TEXT,
  "isTransferred" BOOLEAN NOT NULL DEFAULT false,
  "transferredTo" TEXT,
  "transferredAt" TIMESTAMP(3),
  "metadata" TEXT,
  "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncedAt" TIMESTAMP(3),
  CONSTRAINT "user_nfts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_nfts_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "nfts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ==================== 3. 创建NFT铸造队列表 ====================
CREATE TABLE IF NOT EXISTS "nft_mint_queue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userNftId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "nft_mint_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==================== 4. 创建NFT交易表 ====================
CREATE TABLE IF NOT EXISTS "nft_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionHash" TEXT NOT NULL UNIQUE,
  "fromAddress" TEXT,
  "toAddress" TEXT,
  "tokenId" INTEGER,
  "contractAddress" TEXT,
  "transactionType" TEXT NOT NULL,
  "blockNumber" BIGINT,
  "gasUsed" BIGINT,
  "gasPrice" BIGINT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3)
);

-- ==================== 5. 创建NFT配置表 ====================
CREATE TABLE IF NOT EXISTS "nft_config" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT,
  "description" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 6. 为users表添加NFT和个人资料字段 ====================
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "verifiedType" TEXT,
ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "verificationBadge" TEXT,
ADD COLUMN IF NOT EXISTS "walletAddress" TEXT,
ADD COLUMN IF NOT EXISTS "walletProvider" TEXT,
ADD COLUMN IF NOT EXISTS "walletConnectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "totalNFTs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalTickets" INTEGER NOT NULL DEFAULT 0;

-- ==================== 7. 为tickets表添加NFT关联字段 ====================
ALTER TABLE "tickets"
ADD COLUMN IF NOT EXISTS "nftId" TEXT,
ADD COLUMN IF NOT EXISTS "nftMintStatus" TEXT,
ADD COLUMN IF NOT EXISTS "nftUserNftId" TEXT;

-- ==================== 8. 创建索引 ====================
-- NFTs表索引
CREATE INDEX IF NOT EXISTS "nfts_eventId_idx" ON "nfts"("eventId");
CREATE INDEX IF NOT EXISTS "nfts_category_idx" ON "nfts"("category");
CREATE INDEX IF NOT EXISTS "nfts_sourceType_idx" ON "nfts"("sourceType");
CREATE INDEX IF NOT EXISTS "nfts_isActive_idx" ON "nfts"("isActive");

-- UserNFTs表索引
CREATE UNIQUE INDEX IF NOT EXISTS "user_nfts_contractAddress_tokenId_key" ON "user_nfts"("contractAddress", "tokenId");
CREATE INDEX IF NOT EXISTS "user_nfts_userId_idx" ON "user_nfts"("userId");
CREATE INDEX IF NOT EXISTS "user_nfts_nftId_idx" ON "user_nfts"("nftId");
CREATE INDEX IF NOT EXISTS "user_nfts_ownerWalletAddress_idx" ON "user_nfts"("ownerWalletAddress");
CREATE INDEX IF NOT EXISTS "user_nfts_mintStatus_idx" ON "user_nfts"("mintStatus");
CREATE INDEX IF NOT EXISTS "user_nfts_obtainedAt_idx" ON "user_nfts"("obtainedAt");
CREATE INDEX IF NOT EXISTS "user_nfts_sourceType_idx" ON "user_nfts"("sourceType");

-- NFT Mint Queue表索引
CREATE INDEX IF NOT EXISTS "nft_mint_queue_userNftId_idx" ON "nft_mint_queue"("userNftId");
CREATE INDEX IF NOT EXISTS "nft_mint_queue_status_idx" ON "nft_mint_queue"("status");
CREATE INDEX IF NOT EXISTS "nft_mint_queue_createdAt_idx" ON "nft_mint_queue"("createdAt");
CREATE INDEX IF NOT EXISTS "nft_mint_queue_userId_idx" ON "nft_mint_queue"("userId");

-- NFT Transactions表索引
CREATE INDEX IF NOT EXISTS "nft_transactions_transactionHash_idx" ON "nft_transactions"("transactionHash");
CREATE INDEX IF NOT EXISTS "nft_transactions_transactionType_idx" ON "nft_transactions"("transactionType");
CREATE INDEX IF NOT EXISTS "nft_transactions_toAddress_idx" ON "nft_transactions"("toAddress");
CREATE INDEX IF NOT EXISTS "nft_transactions_status_idx" ON "nft_transactions"("status");

-- NFT Config表索引
CREATE INDEX IF NOT EXISTS "nft_config_key_idx" ON "nft_config"("key");

-- Tickets表新索引
CREATE INDEX IF NOT EXISTS "tickets_nftId_idx" ON "tickets"("nftId");

-- Users表新索引
CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_key" ON "users"("walletAddress");
CREATE INDEX IF NOT EXISTS "users_isVerified_idx" ON "users"("isVerified");

-- ==================== 9. 添加外键约束 ====================
-- Tickets表的NFT外键
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tickets_nftId_fkey'
    ) THEN
        ALTER TABLE "tickets" ADD CONSTRAINT "tickets_nftId_fkey"
        FOREIGN KEY ("nftId") REFERENCES "nfts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
