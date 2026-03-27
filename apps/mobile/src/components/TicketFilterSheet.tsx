/**
 * 门票筛选器组件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/config';
import type { GetMyTicketsParams } from '../services/tickets';

// 活动类别配置
const CATEGORY_OPTIONS = [
  { value: '', label: '全部', icon: '🎯' },
  { value: 'concert', label: '演唱会', icon: '🎤' },
  { value: 'festival', label: '音乐节', icon: '🎪' },
  { value: 'exhibition', label: '展览', icon: '🖼️' },
  { value: 'musicale', label: '音乐会', icon: '🎻' },
  { value: 'show', label: '演出', icon: '🎭' },
  { value: 'sports', label: '体育赛事', icon: '⚽' },
  { value: 'other', label: '其他', icon: '📌' },
];

// 时间范围选项
const DATE_OPTIONS = [
  { value: '', label: '全部时间' },
  { value: 'past', label: '已结束' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
];

// 筛选参数类型（不含状态和分页）
export interface TicketFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface TicketFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: TicketFilters;
  onApply: (filters: TicketFilters) => void;
}

export default function TicketFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
}: TicketFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<TicketFilters>(filters);
  const [dateOption, setDateOption] = useState('');

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      // 根据当前日期范围推断选中的选项
      if (!filters.dateFrom && !filters.dateTo) {
        setDateOption('');
      }
    }
  }, [visible, filters]);

  // 根据日期选项计算日期范围
  const handleDateOptionChange = (option: string) => {
    setDateOption(option);
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (option) {
      case 'past':
        // 已结束的活动：日期在今天之前
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = dateFrom;
        break;
      case 'week':
        dateFrom = today.toISOString().split('T')[0];
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        dateTo = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = today.toISOString().split('T')[0];
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        dateTo = monthEnd.toISOString().split('T')[0];
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setLocalFilters({ ...localFilters, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
  };

  const handleReset = () => {
    setLocalFilters({});
    setDateOption('');
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.dateFrom || localFilters.dateTo) count++;
    if (localFilters.minPrice !== undefined || localFilters.maxPrice !== undefined) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>筛选门票</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetButton}>重置</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 类别筛选 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动类别</Text>
              <View style={styles.optionGrid}>
                {CATEGORY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      localFilters.category === option.value && styles.optionChipActive,
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, category: option.value || undefined })}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        localFilters.category === option.value && styles.optionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 时间筛选 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动时间</Text>
              <View style={styles.optionRow}>
                {DATE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dateChip,
                      dateOption === option.value && styles.dateChipActive,
                    ]}
                    onPress={() => handleDateOptionChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        dateOption === option.value && styles.dateChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 价格范围 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>票价范围</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="最低价"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={localFilters.minPrice?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    setLocalFilters({
                      ...localFilters,
                      minPrice: isNaN(num) ? undefined : num,
                    });
                  }}
                />
                <Text style={styles.priceSeparator}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="最高价"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={localFilters.maxPrice?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    setLocalFilters({
                      ...localFilters,
                      maxPrice: isNaN(num) ? undefined : num,
                    });
                  }}
                />
              </View>
            </View>

          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                确定{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  resetButton: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  optionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  optionLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceSeparator: {
    marginHorizontal: spacing.md,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#000',
  },
});
