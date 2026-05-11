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
  Modal,
  Pressable,
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
  setMemberRole,
  setMemberMute,
  setMemberNickname,
  transferGroupOwner,
  type GroupDetail,
  type GroupMember,
} from '../services/messages';
import { getUser } from '../services/storage';

export default function GroupDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  // 成员操作 modal
  const [actionTarget, setActionTarget] = useState<GroupMember | null>(null);
  // 群昵称编辑 modal
  const [nicknameTarget, setNicknameTarget] = useState<GroupMember | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadGroupDetail();
  }, [groupId]);

  const loadCurrentUser = async () => {
    try {
      const user = await getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      // 静默处理
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
    } catch {
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
                navigation.navigate('Conversations');
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
                navigation.navigate('Conversations');
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
    navigation.navigate('SelectUser', {
      mode: 'addToGroup',
      groupId: groupId,
      existingMemberIds: group?.participants.map((p) => p.id) || [],
    });
  };

  // 通用：调用 API 并 reload
  const runAction = async (
    promise: Promise<{ ok: boolean; error?: string; data?: any }>,
    successMsg: string
  ) => {
    try {
      const res = await promise;
      if (res.ok) {
        Alert.alert('成功', successMsg);
        loadGroupDetail();
      } else {
        Alert.alert('错误', res.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error?.message || '网络错误');
    }
  };

  const handleSetRole = (member: GroupMember, role: 'admin' | 'member') => {
    setActionTarget(null);
    const verb = role === 'admin' ? '设为管理员' : '撤销管理员身份';
    if (role === 'member') {
      Alert.alert(
        '撤销管理员',
        `确定撤销 ${member.nickname} 的管理员身份吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '撤销',
            style: 'destructive',
            onPress: () =>
              runAction(
                setMemberRole(groupId, member.id.toString(), role),
                `已${verb} ${member.nickname}`
              ),
          },
        ]
      );
    } else {
      runAction(
        setMemberRole(groupId, member.id.toString(), role),
        `已${verb} ${member.nickname}`
      );
    }
  };

  const handleToggleMute = (member: GroupMember) => {
    setActionTarget(null);
    const willMute = !member.isMuted;
    if (willMute) {
      Alert.alert(
        '禁言成员',
        `确定禁言 ${member.nickname} 吗？被禁言后该成员无法在群内发送消息。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '禁言',
            style: 'destructive',
            onPress: () =>
              runAction(
                setMemberMute(groupId, member.id.toString(), true),
                `已禁言 ${member.nickname}`
              ),
          },
        ]
      );
    } else {
      runAction(
        setMemberMute(groupId, member.id.toString(), false),
        `已解除 ${member.nickname} 的禁言`
      );
    }
  };

  const handleTransferOwner = (member: GroupMember) => {
    setActionTarget(null);
    Alert.alert(
      '转让群主',
      `确定将群主转让给 ${member.nickname} 吗？\n转让后您将变为普通管理员，无法再解散群聊。此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认转让',
          style: 'destructive',
          onPress: () =>
            runAction(
              transferGroupOwner(groupId, member.id.toString()),
              `群主已转让给 ${member.nickname}`
            ),
        },
      ]
    );
  };

  const openNicknameModal = (member: GroupMember) => {
    setActionTarget(null);
    setNicknameTarget(member);
    setNicknameDraft(member.nickname_in_group || '');
  };

  const handleSaveNickname = async () => {
    if (!nicknameTarget) return;
    setNicknameSaving(true);
    const trimmed = nicknameDraft.trim();
    try {
      const res = await setMemberNickname(
        groupId,
        nicknameTarget.id.toString(),
        trimmed || null
      );
      if (res.ok) {
        Alert.alert('成功', trimmed ? '已设置群昵称' : '已清除群昵称');
        setNicknameTarget(null);
        setNicknameDraft('');
        loadGroupDetail();
      } else {
        Alert.alert('错误', res.error || '保存失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error?.message || '网络错误');
    } finally {
      setNicknameSaving(false);
    }
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

  // 计算成员可见的操作集合
  const getAvailableActions = (m: GroupMember): Array<{
    label: string;
    danger?: boolean;
    onPress: () => void;
  }> => {
    if (!group) return [];
    const isSelf = m.id === currentUserId;
    const myRole = group.myRole;
    const ownerView = myRole === 'owner';
    const adminView = myRole === 'admin';
    const actions: Array<{ label: string; danger?: boolean; onPress: () => void }> = [];

    if (isSelf) {
      actions.push({ label: '设置我的群昵称', onPress: () => openNicknameModal(m) });
      return actions;
    }

    // owner 看其他人
    if (ownerView) {
      if (m.role === 'member') {
        actions.push({ label: '设为管理员', onPress: () => handleSetRole(m, 'admin') });
      }
      if (m.role === 'admin') {
        actions.push({ label: '撤销管理员', danger: true, onPress: () => handleSetRole(m, 'member') });
      }
      if (m.role !== 'owner') {
        actions.push({
          label: m.isMuted ? '取消禁言' : '禁言',
          danger: !m.isMuted,
          onPress: () => handleToggleMute(m),
        });
        actions.push({ label: '设置群昵称', onPress: () => openNicknameModal(m) });
        actions.push({ label: '转让群主', danger: true, onPress: () => handleTransferOwner(m) });
        actions.push({ label: '移除成员', danger: true, onPress: () => { setActionTarget(null); handleRemoveMember(m); } });
      }
      return actions;
    }

    // admin 看其他人：只能管理 member
    if (adminView && m.role === 'member') {
      actions.push({
        label: m.isMuted ? '取消禁言' : '禁言',
        danger: !m.isMuted,
        onPress: () => handleToggleMute(m),
      });
      actions.push({ label: '设置群昵称', onPress: () => openNicknameModal(m) });
      actions.push({ label: '移除成员', danger: true, onPress: () => { setActionTarget(null); handleRemoveMember(m); } });
      return actions;
    }

    // member 看其他人 / admin 看 admin or owner：无操作
    return actions;
  };

  const renderMember = ({ item }: { item: GroupMember }) => {
    const actions = getAvailableActions(item);
    const hasActions = actions.length > 0;
    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => hasActions && setActionTarget(item)}
        onLongPress={() => hasActions && setActionTarget(item)}
        activeOpacity={hasActions ? 0.6 : 1}
        disabled={!hasActions}
      >
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
            <Text style={styles.memberName}>
              {item.nickname_in_group || item.nickname}
            </Text>
            {item.isVerified && <Text style={styles.verifiedBadge}>V</Text>}
            {item.isMuted && <Text style={styles.mutedBadge}>🔇</Text>}
            {item.role !== 'member' && (
              <View style={[styles.roleBadge, item.role === 'owner' && styles.ownerBadge]}>
                <Text style={styles.roleText}>{getRoleText(item.role)}</Text>
              </View>
            )}
          </View>
          {item.nickname_in_group && (
            <Text style={styles.groupNickname}>主昵称: {item.nickname}</Text>
          )}
        </View>
        {hasActions && <Text style={styles.menuDots}>⋮</Text>}
      </TouchableOpacity>
    );
  };

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

      {/* 成员操作 Modal（ActionSheet 样式） */}
      <Modal
        visible={!!actionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTarget(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActionTarget(null)}
        >
          <Pressable
            style={styles.actionSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.actionSheetTitle}>
              {actionTarget?.nickname_in_group || actionTarget?.nickname}
            </Text>
            {actionTarget &&
              getAvailableActions(actionTarget).map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionSheetItem}
                  onPress={a.onPress}
                >
                  <Text
                    style={[
                      styles.actionSheetItemText,
                      a.danger && styles.actionSheetItemDanger,
                    ]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            <TouchableOpacity
              style={[styles.actionSheetItem, styles.actionSheetCancel]}
              onPress={() => setActionTarget(null)}
            >
              <Text style={styles.actionSheetCancelText}>取消</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 群昵称编辑 Modal */}
      <Modal
        visible={!!nicknameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => !nicknameSaving && setNicknameTarget(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !nicknameSaving && setNicknameTarget(null)}
        >
          <Pressable
            style={styles.nicknameModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.nicknameModalTitle}>
              {nicknameTarget?.id === currentUserId
                ? '设置我的群昵称'
                : `设置 ${nicknameTarget?.nickname} 的群昵称`}
            </Text>
            <TextInput
              style={styles.nicknameInput}
              value={nicknameDraft}
              onChangeText={setNicknameDraft}
              placeholder="输入群昵称（最长 20，留空清除）"
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
              editable={!nicknameSaving}
              autoFocus
            />
            <Text style={styles.nicknameHelper}>
              {nicknameDraft.length} / 20 字符。群昵称只在本群显示，不影响主昵称。
            </Text>
            <View style={styles.nicknameButtons}>
              <TouchableOpacity
                style={[styles.nicknameBtn, styles.nicknameBtnCancel]}
                onPress={() => setNicknameTarget(null)}
                disabled={nicknameSaving}
              >
                <Text style={styles.nicknameBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nicknameBtn, styles.nicknameBtnSave]}
                onPress={handleSaveNickname}
                disabled={nicknameSaving}
              >
                <Text style={styles.nicknameBtnSaveText}>
                  {nicknameSaving ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    color: colors.textOnPrimary,
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
    color: colors.textOnPrimary,
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
    color: colors.textOnPrimary,
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
  mutedBadge: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  menuDots: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    paddingVertical: spacing.sm,
  },
  actionSheetTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionSheetItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionSheetItemText: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  actionSheetItemDanger: {
    color: colors.error,
  },
  actionSheetCancel: {
    marginTop: spacing.xs,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  actionSheetCancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  nicknameModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
  },
  nicknameModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  nicknameHelper: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  nicknameButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nicknameBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    alignItems: 'center',
  },
  nicknameBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nicknameBtnCancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  nicknameBtnSave: {
    backgroundColor: colors.primary,
  },
  nicknameBtnSaveText: {
    fontSize: fontSize.md,
    color: colors.textOnPrimary,
    fontWeight: '600',
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
