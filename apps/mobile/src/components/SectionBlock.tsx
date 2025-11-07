import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import type { HomepageSection } from '../services/homepage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2; // 2列布局

interface SectionBlockProps {
  section: HomepageSection;
}

export const SectionBlock: React.FC<SectionBlockProps> = ({ section }) => {
  const navigation = useNavigation();

  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetail' as never, { id: eventId } as never);
  };

  const handleMorePress = () => {
    if (section.moreLink) {
      // 可以根据 moreLink 跳转到相应页面
      navigation.navigate('Events' as never);
    }
  };

  const renderEventCard = ({ item: event }: { item: any }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(event.id)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: event.cover }} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {event.city} · {event.date}
        </Text>
        <Text style={styles.eventPrice}>
          ¥{event.tiers?.[0]?.price || 0}起
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!section.events || section.events.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 栏目标题 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {section.icon && (
            <Text style={styles.icon}>{section.icon}</Text>
          )}
          <View>
            <Text style={styles.title}>{section.title}</Text>
            {section.subtitle && (
              <Text style={styles.subtitle}>{section.subtitle}</Text>
            )}
          </View>
        </View>
        {section.moreLink && (
          <TouchableOpacity onPress={handleMorePress}>
            <Text style={styles.moreText}>查看更多 →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 活动列表 */}
      <FlatList
        data={section.events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  eventCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    backgroundColor: colors.border,
  },
  eventInfo: {
    padding: spacing.md,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventPrice: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
