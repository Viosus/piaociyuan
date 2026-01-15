/**
 * 证件管理页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import {
  getIdDocuments,
  deleteIdDocument,
  setDefaultIdDocument,
  maskIdNumber,
  ID_TYPE_LABELS,
  type UserIdDocument,
  type IdDocumentType,
} from '../services/personalInfo';

export default function IdDocumentsScreen() {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState<UserIdDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 页面获取焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await getIdDocuments();
      if (response.ok && response.data) {
        setDocuments(response.data);
      } else {
        Alert.alert('错误', response.error || '获取证件列表失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '获取证件列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const handleAdd = () => {
    navigation.navigate('AddIdDocument' as never);
  };

  const handleEdit = (document: UserIdDocument) => {
    navigation.navigate('AddIdDocument' as never, { document } as never);
  };

  const handleSetDefault = async (document: UserIdDocument) => {
    if (document.isDefault) return;

    try {
      const response = await setDefaultIdDocument(document.id);
      if (response.ok) {
        // 更新本地状态
        setDocuments(docs =>
          docs.map(d => ({
            ...d,
            isDefault: d.id === document.id,
          }))
        );
      } else {
        Alert.alert('错误', response.error || '设置默认失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '设置默认失败');
    }
  };

  const handleDelete = (document: UserIdDocument) => {
    Alert.alert(
      '删除证件',
      `确定要删除 ${document.fullName} 的${ID_TYPE_LABELS[document.idType]}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteIdDocument(document.id);
              if (response.ok) {
                setDocuments(docs => docs.filter(d => d.id !== document.id));
              } else {
                Alert.alert('错误', response.error || '删除失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除失败');
            }
          },
        },
      ]
    );
  };

  const renderDocumentCard = (document: UserIdDocument) => (
    <TouchableOpacity
      key={document.id}
      style={styles.card}
      onPress={() => handleEdit(document)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>
            {document.idType === 'china_id' ? '🪪' :
             document.idType === 'passport' ? '📕' : '📗'}
          </Text>
          <Text style={styles.typeName}>{ID_TYPE_LABELS[document.idType]}</Text>
          {document.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>默认</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              '操作',
              '',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '设为默认',
                  onPress: () => handleSetDefault(document),
                  disabled: document.isDefault,
                },
                {
                  text: '删除',
                  style: 'destructive',
                  onPress: () => handleDelete(document),
                },
              ]
            );
          }}
        >
          <Text style={styles.moreIcon}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>姓名</Text>
          <Text style={styles.value}>{document.fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>证件号</Text>
          <Text style={styles.value}>
            {maskIdNumber(document.idNumber, document.idType)}
          </Text>
        </View>
        {document.expiryDate && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>有效期至</Text>
            <Text style={styles.value}>
              {new Date(document.expiryDate).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && documents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {documents.length > 0 ? (
          documents.map(renderDocumentCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🪪</Text>
            <Text style={styles.emptyText}>暂无证件信息</Text>
            <Text style={styles.emptyHint}>添加证件后可用于购票实名认证</Text>
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+ 添加证件</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: fontSize.xs,
    color: '#000',
    fontWeight: '600',
  },
  moreButton: {
    padding: spacing.sm,
  },
  moreIcon: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
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
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#000',
  },
});
