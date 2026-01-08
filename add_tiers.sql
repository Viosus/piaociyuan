-- 添加票档数据

-- Event ID 20: 张学友「60+」世界巡回演唱会 - 上海站
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (20, 'VIP区', 1280, 500, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (20, '内场', 880, 2000, 2000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (20, '看台A区', 580, 3000, 3000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (20, '看台B区', 380, 4000, 4000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 21: 泰勒·斯威夫特「The Eras Tour」中国站
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (21, 'VIP区', 1980, 800, 800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (21, '内场', 1280, 3000, 3000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (21, '看台A区', 880, 5000, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (21, '看台B区', 580, 6000, 6000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 22: 迷笛音乐节 2026 - 北京站
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (22, '早鸟三日通票', 480, 5000, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (22, '三日通票', 680, 10000, 10000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (22, '单日票', 280, 5000, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 23: 德云社相声专场 - 郭德纲于谦经典相声大会
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (23, '前排', 580, 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (23, '中排', 380, 200, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (23, '后排', 180, 300, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 24: NBA中国赛 2026 - 湖人vs勇士
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (24, 'VIP', 2880, 300, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (24, '内场看台', 1580, 2000, 2000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (24, '普通看台', 880, 5000, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 25: 梵高星空艺术展 - 沉浸式体验
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (25, '单人票', 120, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (25, '双人票', 200, 500, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (25, '家庭票（2大1小）', 280, 300, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 26: 朗朗钢琴独奏音乐会
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (26, 'VIP区', 1280, 200, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (26, '一等座', 880, 500, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (26, '二等座', 580, 800, 800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (26, '三等座', 380, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 27: 开心麻花《夏洛特烦恼》舞台剧
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (27, '前排', 480, 150, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (27, '中排', 280, 250, 250, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (27, '后排', 180, 300, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 28: 李宗盛「既然青春留不住」演唱会
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (28, 'VIP区', 1580, 600, 600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (28, '内场', 980, 2500, 2500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (28, '看台A区', 680, 3500, 3500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (28, '看台B区', 480, 4000, 4000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Event ID 29: 草莓音乐节 2026 - 成都站
INSERT INTO tiers ("eventId", name, price, capacity, remaining, "createdAt", "updatedAt")
VALUES
  (29, '早鸟双日通票', 380, 3000, 3000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (29, '双日通票', 520, 8000, 8000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (29, '单日票', 280, 4000, 4000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
