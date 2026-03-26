import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getUserCollectibles, UserCollectible } from '../services/collectibles';
import { COLORS } from '../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollectibleDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [item, setItem] = useState<UserCollectible | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserCollectibles(1)
      .then((data) => {
        const found = data.items.find((i: UserCollectible) => i.id === id);
        setItem(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>收藏品不存在</Text>
      </View>
    );
  }

  const { collectible } = item;
  const categoryLabels: Record<string, string> = {
    badge: '徽章',
    ticket_stub: '票根',
    poster: '海报',
    certificate: '证书',
    art: '艺术品',
  };
  const sourceLabels: Record<string, string> = {
    ticket_purchase: '购票获得',
    gift: '赠送获得',
    achievement: '成就获得',
  };

  return (
    <ScrollView style={styles.container}>
      {/* 图片展示 */}
      <Image
        source={{ uri: collectible.imageUrl }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {collectible.has3DModel && (
        <View style={styles.badge3D}>
          <Text style={styles.badge3DText}>支持 3D 预览</Text>
        </View>
      )}

      {/* 基本信息 */}
      <View style={styles.content}>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {categoryLabels[collectible.category] || collectible.category}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{collectible.name}</Text>
        <Text style={styles.description}>{collectible.description}</Text>

        {/* 详细信息 */}
        <View style={styles.infoCard}>
          <InfoRow label="领取时间" value={new Date(item.obtainedAt).toLocaleString('zh-CN')} />
          <InfoRow label="来源" value={sourceLabels[item.sourceType] || item.sourceType} />
          <InfoRow
            label="发行量"
            value={`${collectible.claimedCount} / ${collectible.totalSupply}`}
          />
          {collectible.event && (
            <InfoRow label="关联活动" value={collectible.event.name} />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999' },
  heroImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#f0f0f0' },
  badge3D: {
    position: 'absolute',
    top: SCREEN_WIDTH - 40,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badge3DText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { padding: 20 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { color: '#7c3aed', fontSize: 12, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1f', marginBottom: 10 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  infoCard: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  infoLabel: { fontSize: 14, color: '#999' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
});
