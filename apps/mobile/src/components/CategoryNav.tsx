import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/config';

export interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: '全部', icon: 'apps-outline' },
  { id: 'concert', name: '演唱会', icon: 'mic-outline' },
  { id: 'festival', name: '音乐节', icon: 'musical-notes-outline' },
  { id: 'exhibition', name: '展览', icon: 'color-palette-outline' },
  { id: 'musicale', name: '音乐会', icon: 'headset-outline' },
  { id: 'show', name: '演出', icon: 'film-outline' },
  { id: 'sports', name: '体育赛事', icon: 'football-outline' },
  { id: 'other', name: '其他', icon: 'ellipsis-horizontal-outline' },
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
              <Ionicons
                name={category.icon}
                size={22}
                color={isSelected ? '#ffffff' : colors.primary}
                style={styles.categoryIcon}
              />
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
