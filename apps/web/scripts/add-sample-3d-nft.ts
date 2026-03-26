// scripts/add-sample-3d-nft.ts
/**
 * 添加票次元样例 3D NFT 到数据库
 *
 * 使用方法：
 *   npx tsx scripts/add-sample-3d-nft.ts
 *
 * 环境变量（可选）：
 *   MODEL_3D_URL - 3D 模型的完整 URL（生产环境使用云存储 URL）
 *
 * 这个脚本会：
 * 1. 创建一个带有 3D 模型的 NFT 记录
 * 2. 为第一个用户创建 UserNFT 关联（如果有用户的话）
 *
 * 注意：
 * - 开发环境：将 Work_Model.glb 放在 apps/web/public/models/ 目录
 * - 生产环境：将文件上传到云存储（如阿里云 OSS），设置 MODEL_3D_URL 环境变量
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 公开的免费测试 3D 模型（来自 Google Model Viewer 官方示例）
// 这些模型很小（几百 KB），适合测试
const TEST_MODELS = [
  {
    name: '次元宇航员',
    description: '来自星际的神秘访客，票次元限定 3D 数字藏品。',
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    posterUrl: 'https://modelviewer.dev/assets/poster-astronaut.webp',
    rarity: 'legendary',
  },
  {
    name: '机械伙伴',
    description: '富有表情的机器人朋友，票次元限定 3D 数字藏品。',
    modelUrl: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    posterUrl: 'https://modelviewer.dev/assets/poster-robotexpressive.webp',
    rarity: 'epic',
  },
  {
    name: '复古风扇',
    description: '精致的复古电风扇模型，票次元限定 3D 数字藏品。',
    modelUrl: 'https://modelviewer.dev/shared-assets/models/ShopifyModels/Chair.glb',
    posterUrl: 'https://via.placeholder.com/400x400/46467A/FFFFFF?text=3D+Chair',
    rarity: 'rare',
  },
];

// 选择使用的模型（可通过环境变量覆盖）
const MODEL_INDEX = parseInt(process.env.MODEL_INDEX || '0', 10);
const SELECTED_MODEL = TEST_MODELS[MODEL_INDEX] || TEST_MODELS[0];

// 也支持自定义模型 URL
const CUSTOM_MODEL_URL = process.env.MODEL_3D_URL;

const SAMPLE_3D_NFT = {
  name: CUSTOM_MODEL_URL ? '票次元限定 3D 藏品' : SELECTED_MODEL.name,
  description: CUSTOM_MODEL_URL
    ? '票次元限定 3D 数字藏品，独特的艺术造型，可在次元空间中 360 度欣赏。'
    : SELECTED_MODEL.description,
  imageUrl: CUSTOM_MODEL_URL
    ? 'https://via.placeholder.com/400x400/46467A/FFFFFF?text=3D+NFT'
    : SELECTED_MODEL.posterUrl,
  model3DUrl: CUSTOM_MODEL_URL || SELECTED_MODEL.modelUrl,
  modelFormat: 'glb',
  sourceType: 'standalone',
  category: 'art',
  rarity: CUSTOM_MODEL_URL ? 'legendary' : SELECTED_MODEL.rarity,
  totalSupply: 100,
};

async function main() {
  console.log('🎨 开始添加票次元样例 3D NFT...\n');

  // 1. 检查模型 URL 是否已存在
  const existingNFT = await prisma.nFT.findFirst({
    where: {
      model3DUrl: SAMPLE_3D_NFT.model3DUrl,
    },
  });

  if (existingNFT) {
    console.log('⚠️ 该 3D 模型已存在于数据库中:');
    console.log(`   NFT ID: ${existingNFT.id}`);
    console.log(`   名称: ${existingNFT.name}`);
    console.log(`   模型 URL: ${existingNFT.model3DUrl}`);

    // 确保 has3DModel 为 true
    if (!existingNFT.has3DModel) {
      await prisma.nFT.update({
        where: { id: existingNFT.id },
        data: { has3DModel: true },
      });
      console.log('   已更新 has3DModel 为 true');
    }

    return;
  }

  // 2. 创建 NFT 记录
  console.log('📝 创建 NFT 记录...');

  const nft = await prisma.nFT.create({
    data: {
      name: SAMPLE_3D_NFT.name,
      description: SAMPLE_3D_NFT.description,
      imageUrl: SAMPLE_3D_NFT.imageUrl,
      sourceType: SAMPLE_3D_NFT.sourceType,
      category: SAMPLE_3D_NFT.category,
      rarity: SAMPLE_3D_NFT.rarity,
      totalSupply: SAMPLE_3D_NFT.totalSupply,
      mintedCount: 0,
      has3DModel: true,
      model3DUrl: SAMPLE_3D_NFT.model3DUrl,
      modelFormat: SAMPLE_3D_NFT.modelFormat,
      hasAR: false,
      hasAnimation: true,
      isActive: true,
      isMintable: true,
      isMarketable: false,
    },
  });

  console.log('✅ NFT 创建成功:');
  console.log(`   ID: ${nft.id}`);
  console.log(`   名称: ${nft.name}`);
  console.log(`   稀有度: ${nft.rarity}`);
  console.log(`   3D 模型: ${nft.model3DUrl}`);

  // 3. 为第一个用户创建 UserNFT
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (user) {
    console.log(`\n👤 找到用户: ${user.nickname || user.email || user.phone}`);

    // 检查是否已有此 NFT
    const existingUserNFT = await prisma.userNFT.findFirst({
      where: {
        userId: user.id,
        nftId: nft.id,
      },
    });

    if (!existingUserNFT) {
      const userNft = await prisma.userNFT.create({
        data: {
          userId: user.id,
          nftId: nft.id,
          sourceType: 'airdrop',
          sourceId: 'sample-3d-nft',
          contractAddress: '0x0000000000000000000000000000000000000000',
          tokenId: 1,
          ownerWalletAddress: user.walletAddress || '0x0000000000000000000000000000000000000000',
          isOnChain: false,
          mintStatus: 'minted',
          mintedAt: new Date(),
          obtainedAt: new Date(),
          metadata: JSON.stringify({
            edition: '1/100',
            source: '票次元样例',
          }),
        },
      });

      // 更新 NFT 已铸造数量
      await prisma.nFT.update({
        where: { id: nft.id },
        data: { mintedCount: 1 },
      });

      console.log('✅ 已为用户分配 NFT:');
      console.log(`   UserNFT ID: ${userNft.id}`);
      console.log(`   Token ID: ${userNft.tokenId}`);
    } else {
      console.log('⚠️ 用户已拥有此 NFT');
    }
  } else {
    console.log('\n⚠️ 没有找到用户，跳过 UserNFT 创建');
    console.log('   用户注册后可以手动分配或通过空投获取');
  }

  console.log('\n🎉 完成！');
  console.log('\n📱 在 Web 端访问「我的次元」或「NFT 详情」查看 3D 模型');
  console.log('📱 在 Mobile 端访问「我的次元」查看 3D 模型');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
