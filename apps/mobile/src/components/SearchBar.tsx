import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/config';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  editable?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '搜索活动、艺人...',
  onSearch,
  onFocus,
  editable = true,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          onFocus={onFocus}
          editable={editable}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    padding: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
