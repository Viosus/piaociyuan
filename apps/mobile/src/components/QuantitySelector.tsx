import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/config';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
}) => {
  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const canDecrease = value > min && !disabled;
  const canIncrease = value < max && !disabled;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          !canDecrease && styles.buttonDisabled,
        ]}
        onPress={handleDecrease}
        disabled={!canDecrease}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            !canDecrease && styles.buttonTextDisabled,
          ]}
        >
          −
        </Text>
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          !canIncrease && styles.buttonDisabled,
        ]}
        onPress={handleIncrease}
        disabled={!canIncrease}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            !canIncrease && styles.buttonTextDisabled,
          ]}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: fontSize.xl,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  valueContainer: {
    minWidth: 40,
    alignItems: 'center',
  },
  valueText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
});
