// scripts/add-3d-models.ts
/**
 * 为纪念品添加3D/AR模型示例
 *
 * 这个脚本展示如何为纪念品配置3D模型和AR功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 为纪念品添加3D/AR模型配置...\n');

  // 示例：为传说级海报添加3D模型
  const legendaryPosters = await prisma.badge.findMany({
    where: {
      type: 'poster',
      rarity: 'legendary',
    },
  });

  console.log(`📋 找到 ${legendaryPosters.length} 个传说级海报\n`);

  for (const poster of legendaryPosters) {
    console.log(`🖼️  更新: ${poster.name}`);

    // 配置3D模型
    const modelConfig = {
      // 初始位置
      position: { x: 0, y: 0, z: 0 },
      // 初始旋转 (角度)
      rotation: { x: 0, y: 0, z: 0 },
      // 缩放
      scale: { x: 1, y: 1, z: 1 },
      // 灯光设置
      lighting: {
        ambient: { intensity: 0.5 },
        directional: {
          intensity: 1.0,
          position: { x: 10, y: 10, z: 10 },
        },
      },
      // 相机设置
      camera: {
        fov: 75,
        position: { x: 0, y: 0, z: 5 },
      },
      // 动画设置
      animation: {
        autoRotate: true,
        rotateSpeed: 0.5,
      },
    };

    await prisma.badge.update({
      where: { id: poster.id },
      data: {
        has3DModel: true,
        model3DUrl: `/models/poster-${poster.eventId}.glb`, // glTF Binary格式
        modelFormat: 'glb',
        hasAR: true,
        arUrl: `/models/poster-${poster.eventId}.usdz`, // iOS AR Quick Look格式
        hasAnimation: true,
        animationUrl: `/models/poster-${poster.eventId}-anim.glb`,
        modelConfig: JSON.stringify(modelConfig),
      },
    });

    console.log(`   ✅ 3D模型: /models/poster-${poster.eventId}.glb`);
    console.log(`   ✅ AR模型: /models/poster-${poster.eventId}.usdz`);
    console.log(`   ✅ 动画: /models/poster-${poster.eventId}-anim.glb\n`);
  }

  // 示例：为活动徽章添加简单3D模型
  const eventBadges = await prisma.badge.findMany({
    where: {
      type: 'badge',
      tierId: null, // 活动级别徽章
    },
  });

  console.log(`\n📋 找到 ${eventBadges.length} 个活动徽章\n`);

  for (const badge of eventBadges) {
    console.log(`🏅 更新: ${badge.name}`);

    const modelConfig = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      lighting: {
        ambient: { intensity: 0.6 },
        directional: {
          intensity: 0.8,
          position: { x: 5, y: 5, z: 5 },
        },
      },
      camera: {
        fov: 60,
        position: { x: 0, y: 0, z: 3 },
      },
      animation: {
        autoRotate: true,
        rotateSpeed: 1.0,
        bounce: true, // 上下浮动效果
      },
    };

    await prisma.badge.update({
      where: { id: badge.id },
      data: {
        has3DModel: true,
        model3DUrl: `/models/badge-${badge.eventId}.glb`,
        modelFormat: 'glb',
        hasAR: true,
        arUrl: `/models/badge-${badge.eventId}.usdz`,
        modelConfig: JSON.stringify(modelConfig),
      },
    });

    console.log(`   ✅ 3D模型: /models/badge-${badge.eventId}.glb`);
    console.log(`   ✅ AR模型: /models/badge-${badge.eventId}.usdz\n`);
  }

  // 统计
  const stats = await prisma.badge.groupBy({
    by: ['has3DModel', 'hasAR'],
    _count: true,
  });

  console.log('\n📊 3D/AR统计:');
  stats.forEach((stat) => {
    console.log(
      `   ${stat.has3DModel ? '🎮' : '⭕'} 3D模型  ${stat.hasAR ? '📱' : '⭕'} AR支持: ${stat._count} 个`
    );
  });

  console.log('\n✅ 3D/AR模型配置完成！');
  console.log(
    '\n💡 提示: 实际使用时需要准备对应的3D模型文件 (.glb, .usdz)'
  );
  console.log(
    '   - .glb: 用于Web 3D查看器 (Three.js, Babylon.js等)'
  );
  console.log('   - .usdz: 用于iOS AR Quick Look');
  console.log('   - Android可使用.glb配合Scene Viewer\n');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
