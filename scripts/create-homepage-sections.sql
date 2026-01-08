-- 创建首页栏目数据
INSERT INTO homepage_sections (id, title, subtitle, icon, "bgGradient", "moreLink", "order", "isActive", type, "autoConfig", "createdAt", "updatedAt")
VALUES
  ('section-hot', '热门活动', '大家都在看', '🔥', 'from-orange-50 to-red-50', '/events?sort=popular', 1, true, 'auto_status', '{"status":"on_sale","limit":6}', NOW(), NOW()),
  ('section-upcoming', '即将开售', '抢先预约', '⏰', 'from-blue-50 to-cyan-50', '/events?sort=upcoming', 2, true, 'auto_status', '{"status":"not_started","limit":6}', NOW(), NOW()),
  ('section-music', '音乐演出', '聆听精彩', '🎵', 'from-purple-50 to-pink-50', '/events?category=concert', 3, true, 'auto_category', '{"category":"concert","limit":6}', NOW(), NOW()),
  ('section-exhibition', '展览活动', '艺术之旅', '🎨', 'from-green-50 to-teal-50', '/events?category=exhibition', 4, true, 'auto_category', '{"category":"exhibition","limit":6}', NOW(), NOW());
