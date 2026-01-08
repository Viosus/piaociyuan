/**
 * 群聊详情页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import {
  getGroupDetail,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  disbandGroup,
  type GroupDetail,
  type GroupMember,
} from '../services/messages';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroupDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadGroupDetail();
  }, [groupId]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Load current user error:', error);
    }
  };

  const loadGroupDetail = async () => {
    try {
      setLoading(true);
      const response = await getGroupDetail(groupId);
      if (response.ok && response.data) {
        setGroup(response.data);
        setNewName(response.data.name);
      } else {
        Alert.alert('错误', response.error || '获取群聊详情失败');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load group detail error:', error);
      Alert.alert('错误', '获取群聊详情失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim() === group?.name) {
      setEditing(false);
      return;
    }

    try {
      const response = await updateGroup(groupId, { name: newName.trim() });
      if (response.ok) {
        setGroup((prev) => prev ? { ...prev, name: newName.trim() } : null);
        setEditing(false);
        Alert.alert('成功', '群名称已更新');
      } else {
        Alert.alert('错误', response.error || '更新失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '更新失败');
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (member.role === 'owner') {
      Alert.alert('提示', '不能移除群主');
      return;
    }

    Alert.alert(
      '移除成员',
      `确定要将 ${member.nickname} 移出群聊吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await removeGroupMember(groupId, member.id.toString());
              if (response.ok) {
                loadGroupDetail();
              } else {
                Alert.alert('错误', response.error || '移除失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '移除失败');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      '退出群聊',
      '确定要退出该群聊吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await leaveGroup(groupId);
              if (response.ok) {
                Alert.alert('成功', response.data?.message || '已退出群聊');
                navigation.navigate('Conversations' as never);
              } else {
                Alert.alert('错误', response.error || '退出失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '退出失败');
            }
          },
        },
      ]
    );
  };

  const handleDisbandGroup = () => {
    Alert.alert(
      '解散群聊',
      '确定要解散该群聊吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解散',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await disbandGroup(groupId);
              if (response.ok) {
                Alert.alert('成功', response.data?.message || '群聊已解散');
                navigation.navigate('Conversations' as never);
              } else {
                Alert.alert('错误', response.error || '解散失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '解散失败');
            }
          },
        },
      ]
    );
  };

  const handleAddMembers = () => {
    navigation.navigate('SelectUser' as never, {
      mode: 'addToGroup',
      groupId: groupId,
      existingMemberIds: group?.participants.map((p) => p.id) || [],
    } as never);
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return '群主';
      case 'admin':
        return '管理员';
      default:
        return '';
    }
  };

  const isOwner = group?.myRole === 'owner';
  const isAdmin = group?.myRole === 'admin' || isOwner;

  const renderMember = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItem}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, styles.defaultAvatar]}>
          <Text style={styles.defaultAvatarText}>
            {(item.nickname || '?')[0]}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>{item.nickname}</Text>
          {item.isVerified && <Text style={styles.verifiedBadge}>V</Text>}
          {item.role !== 'member' && (
            <View style={[styles.roleBadge, item.role === 'owner' && styles.ownerBadge]}>
              <Text style={styles.roleText}>{getRoleText(item.role)}</Text>
            </View>
          )}
        </View>
        {item.nickname_in_group && (
          <Text style={styles.groupNickname}>群昵称: {item.nickname_in_group}</Text>
        )}
      </View>
      {isAdmin && item.role !== 'owner' && item.id !== currentUserId && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMember(item)}
        >
          <Text style={styles.removeButtonText}>移除</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>群聊不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>群聊详情</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* 群信息 */}
      <View style={styles.groupInfo}>
        {group.avatar ? (
          <Image source={{ uri: group.avatar }} style={styles.groupAvatar} />
        ) : (
          <View style={[styles.groupAvatar, styles.defaultGroupAvatar]}>
            <Text style={styles.defaultGroupAvatarText}>👥</Text>
          </View>
        )}
        {editing ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              maxLength={30}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => isAdmin && setEditing(true)}
            disabled={!isAdmin}
          >
            <Text style={styles.groupName}>{group.name}</Text>
            {isAdmin && <Text style={styles.editIcon}>✏️</Text>}
          </TouchableOpacity>
        )}
        <Text style={styles.memberCount}>{group.memberCount} 人</Text>
        {group.description && (
          <Text style={styles.description}>{group.description}</Text>
        )}
      </View>

      {/* 成员列表 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>群成员 ({group.memberCount})</Text>
          {isAdmin && (
            <TouchableOpacity onPress={handleAddMembers}>
              <Text style={styles.addMemberButton}>+ 添加</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={group.participants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMember}
          style={styles.memberList}
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.footer}>
        {isOwner ? (
          <TouchableOpacity style={styles.dangerButton} onPress={handleDisbandGroup}>
            <Text style={styles.dangerButtonText}>解散群聊</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.dangerButton} onPress={handleLeaveGroup}>
            <Text style={styles.dangerButtonText}>退出群聊</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  groupInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  defaultGroupAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultGroupAvatarText: {
    fontSize: 36,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  editIcon: {
    fontSize: fontSize.md,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    fontSize: fontSize.lg,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
    minWidth: 150,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  saveButtonText: {
    fontSize: fontSize.sm,
    color: '#fff',
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  memberCount: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  section: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  addMemberButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  memberList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: 'bold',
  },
  roleBadge: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadge: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  groupNickname: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeButtonText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
});
