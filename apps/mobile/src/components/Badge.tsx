import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../constants/config';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return fontSize.xs;
      case 'medium':
        return fontSize.sm;
      case 'large':
        return fontSize.md;
      default:
        return fontSize.sm;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.xs / 2, paddingHorizontal: spacing.xs };
      case 'medium':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
      case 'large':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      default:
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: getFontSize() }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});
