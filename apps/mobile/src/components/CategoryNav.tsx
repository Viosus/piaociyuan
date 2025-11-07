import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/config';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: '全部', icon: '🎭' },
  { id: 'concert', name: '演唱会', icon: '🎤' },
  { id: 'festival', name: '音乐节', icon: '🎸' },
  { id: 'exhibition', name: '展览', icon: '🎨' },
  { id: 'musicale', name: '音乐会', icon: '🎼' },
  { id: 'show', name: '演出', icon: '🎪' },
  { id: 'sports', name: '体育赛事', icon: '⚽' },
  { id: 'other', name: '其他', icon: '🎯' },
];

interface CategoryNavProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
              onPress={() => onSelectCategory?.(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    minWidth: 70,
  },
  categoryItemActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: fontSize.xl,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
