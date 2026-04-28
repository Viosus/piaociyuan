/**
 * 选择用户页面（用于新建对话或添加群成员）
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize, shadows } from '../constants/config';
import { UserListItem } from '../components/UserListItem';
import { createConversation, addGroupMembers } from '../services/messages';
import { apiClient } from '../services/api';
import { FollowUser } from '../services/users';
import { useDebounce } from '../hooks/useDebounce';

export default function SelectUserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, groupId, existingMemberIds = [] } = (route.params as {
    mode?: 'addToGroup';
    groupId?: string;
    existingMemberIds?: number[];
  }) || {};

  const isAddToGroupMode = mode === 'addToGroup' && groupId;

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  React.useEffect(() => {
    if (debouncedSearch.length > 0) {
      searchUsers(debouncedSearch);
    } else {
      setUsers([]);
    }
  }, [debouncedSearch]);

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);

      // 调用搜索用户 API
      const response = await apiClient.get<FollowUser[]>(`/api/user/search?q=${encodeURIComponent(query)}&limit=20`);

      if (response.ok && response.data) {
        // 添加群成员模式：过滤掉已存在的成员
        if (isAddToGroupMode && existingMemberIds.length > 0) {
          setUsers(response.data.filter(u => !existingMemberIds.includes(u.id)));
        } else {
          setUsers(response.data);
        }
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: FollowUser) => {
    if (selectedUserId === user.id) return;

    try {
      setSelectedUserId(user.id);

      if (isAddToGroupMode) {
        // 添加群成员
        const response = await addGroupMembers(groupId!, [user.id.toString()]);

        if (response.ok) {
          Alert.alert('成功', `已添加 ${user.nickname} 到群聊`);
          navigation.goBack();
        } else {
          Alert.alert('错误', response.error || '添加成员失败');
        }
      } else {
        // 创建对话
        const response = await createConversation(user.id);

        if (response.ok && response.data) {
          // 跳转到聊天页面
          navigation.navigate('Chat' as never, {
            conversationId: response.data.id,
          } as never);
        } else {
          Alert.alert('错误', response.error || '创建对话失败');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || isAddToGroupMode ? '添加成员失败' : '创建对话失败');
    } finally {
      setSelectedUserId(null);
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (searchQuery.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>{isAddToGroupMode ? '搜索并添加成员' : '搜索用户'}</Text>
          <Text style={styles.emptyHint}>输入昵称或手机号查找用户</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={styles.emptyText}>未找到用户</Text>
        <Text style={styles.emptyHint}>试试其他关键词</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索用户..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 用户列表 */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            onPress={() => handleUserSelect(item)}
            followLoading={selectedUserId === item.id}
          />
        )}
        contentContainerStyle={users.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceGlass,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceGlassTint,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  clearIcon: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    paddingLeft: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
