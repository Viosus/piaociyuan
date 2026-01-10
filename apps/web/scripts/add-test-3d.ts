import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 免费的公开测试 GLB 模型
const TEST_MODELS = [
  { url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', name: '宇航员' },
  { url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', name: '机器人' },
  { url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb', name: '阿姆斯特朗' },
];

async function main() {
  // 查找第一个用户
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('⚠️ 没有用户，请先注册一个账号');
    return;
  }
  console.log('找到用户:', user.nickname || user.email);

  // 查看现有 NFT
  const existingNFTs = await prisma.nFT.findMany({
    take: 5,
    select: { id: true, name: true, has3DModel: true, model3DUrl: true }
  });

  console.log('现有 NFT 数量:', existingNFTs.length);

  if (existingNFTs.length > 0) {
    // 更新第一个 NFT，添加 3D 模型
    const updated = await prisma.nFT.update({
      where: { id: existingNFTs[0].id },
      data: {
        has3DModel: true,
        model3DUrl: TEST_MODELS[0].url,
        modelFormat: 'glb'
      }
    });
    console.log('\n✅ 已更新现有 NFT，添加测试 3D 模型:');
    console.log('  名称:', updated.name);
    console.log('  模型 URL:', updated.model3DUrl);
  } else {
    // 创建测试 NFT
    console.log('\n创建测试 NFT...');

    const nft = await prisma.nFT.create({
      data: {
        name: '次元宇航员',
        description: '这是一个 3D 测试藏品 - 宇航员模型',
        imageUrl: 'https://modelviewer.dev/assets/poster-astronaut.webp',
        sourceType: 'standalone',
        category: 'art',
        rarity: 'epic',
        totalSupply: 100,
        mintedCount: 1,
        has3DModel: true,
        model3DUrl: TEST_MODELS[0].url,
        modelFormat: 'glb',
        hasAR: false,
        hasAnimation: true,
        isActive: true,
        isMintable: true,
        isMarketable: false,
      }
    });
    console.log('✅ 创建 NFT:', nft.name);

    // 创建 UserNFT（用户拥有的 NFT）
    const userNft = await prisma.userNFT.create({
      data: {
        userId: user.id,
        nftId: nft.id,
        sourceType: 'direct_purchase',
        contractAddress: '0x0000000000000000000000000000000000000000',
        tokenId: 1,
        ownerWalletAddress: '0x0000000000000000000000000000000000000000',
        isOnChain: false,
        mintStatus: 'minted',
        mintedAt: new Date(),
        obtainedAt: new Date(),
      }
    });
    console.log('✅ 创建用户 NFT 关联');
    console.log('\n🎉 测试数据创建完成！');
    console.log('现在可以去「我的次元」查看 3D 模型了');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
