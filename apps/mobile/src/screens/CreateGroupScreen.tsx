/**
 * 创建群聊页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { createGroup } from '../services/messages';
import { apiClient } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

interface User {
  id: string;
  nickname: string;
  avatar?: string;
  isVerified?: boolean;
}

export default function CreateGroupScreen() {
  const navigation = useNavigation();

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearch.length > 0) {
      searchUsers(debouncedSearch);
    } else {
      setUsers([]);
    }
  }, [debouncedSearch]);

  const searchUsers = async (query: string) => {
    try {
      setSearching(true);
      const response = await apiClient.get<User[]>(`/api/user/search?q=${encodeURIComponent(query)}&limit=20`);

      if (response.ok && response.data) {
        // 过滤掉已选择的用户
        const filtered = response.data.filter(
          u => !selectedUsers.find(s => s.id === u.id)
        );
        setUsers(filtered);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setUsers(users.filter(u => u.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('提示', '请输入群名称');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('提示', '请选择至少一个群成员');
      return;
    }

    try {
      setCreating(true);
      const response = await createGroup({
        name: groupName.trim(),
        memberIds: selectedUsers.map(u => u.id),
      });

      if (response.ok && response.data) {
        // 跳转到聊天页面
        navigation.navigate('Chat' as never, {
          conversationId: response.data.id,
          isGroup: true,
          groupName: response.data.name,
        } as never);
      } else {
        Alert.alert('错误', response.error || '创建群聊失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '创建群聊失败');
    } finally {
      setCreating(false);
    }
  };

  const renderSelectedUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.selectedUserItem}
      onPress={() => handleRemoveUser(item.id)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.selectedAvatar} />
      ) : (
        <View style={[styles.selectedAvatar, styles.defaultAvatar]}>
          <Text style={styles.defaultAvatarText}>
            {(item.nickname || '?')[0]}
          </Text>
        </View>
      )}
      <Text style={styles.selectedName} numberOfLines={1}>
        {item.nickname}
      </Text>
      <View style={styles.removeButton}>
        <Text style={styles.removeButtonText}>x</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.defaultAvatar]}>
          <Text style={styles.defaultAvatarText}>
            {(item.nickname || '?')[0]}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.nickname}</Text>
          {item.isVerified && (
            <Text style={styles.verifiedBadge}>V</Text>
          )}
        </View>
      </View>
      <View style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 群名称输入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>群名称</Text>
        <TextInput
          style={styles.groupNameInput}
          placeholder="请输入群名称"
          placeholderTextColor={colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={30}
        />
      </View>

      {/* 已选成员 */}
      {selectedUsers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            已选成员（{selectedUsers.length}人）
          </Text>
          <FlatList
            data={selectedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderSelectedUser}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* 搜索用户 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>添加成员</Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索用户..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 用户列表 */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.userList}
        ListEmptyComponent={
          searching ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : searchQuery.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>未找到用户</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>搜索并添加群成员</Text>
            </View>
          )
        }
      />

      {/* 创建按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!groupName.trim() || selectedUsers.length === 0) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={creating || !groupName.trim() || selectedUsers.length === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              创建群聊（{selectedUsers.length}人）
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  groupNameInput: {
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedList: {
    paddingVertical: spacing.xs,
  },
  selectedUserItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: spacing.xs,
  },
  selectedName: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
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
  userList: {
    paddingHorizontal: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  verifiedBadge: {
    marginLeft: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.lg,
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.border,
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#fff',
  },
});
